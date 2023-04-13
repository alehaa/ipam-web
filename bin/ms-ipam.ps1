#!powershell

# This file is part of IPAM Web.
#
# Copyright (c) Alexander Haase <ahaase@alexhaase.de>
#
# This project is licensed under the MIT License. For the full copyright and
# license information, please view the LICENSE file that was distributed with
# this source code.

# This script handles data from Microsoft IPAM to be converted into the JSON
# format required for IPAM Web.
#
# NOTE: This script is designed for running on Powershell 7. As the required
#       modules aren't available for PowerShell Docker images, this script will
#       run on Windows hosts only.

param (
  # The CimSession, required for logon on the IPAM server. It will have the IPAM
  # server set as session parameter, so following IPAM cmdlets won't require it
  # as extra parameter.
  [Parameter(Mandatory)] [CimSession[]] $CimSession,

  # Where to store the API collection files. Typically this path doesn't need to
  # be changed, as it has the hardcoded HTTP path already set. However, it might
  # be changed when this script is not called from the web root as current
  # working directory (CWD).
  [String] $Path = 'api',

  # Most fields of MS IPAM are fixed. However, setting the site for a managed
  # object is not always possible in an easy way. To solve this, administrators
  # may define a custom field instead. The following parameter can be used to
  # use this field as fallback, if the 'NetworkSite' is not set.
  [String] $SiteField
)


# =======
# Modules
# =======
#
# PowerShell 7.0 will use a compatibility layer for older modules, which is not
# compatible with some arguments, like the CimSession. Therefore, these modules
# will be loaded directly into the current session without the compatibility
# layer enabled.

Import-Module IpamServer -SkipEditionCheck


# =========
# Functions
# =========

##
# Convert DateTime object to date-only string.
#
#
# @param _ The DateTime object to be converted.
#
# @returns Date in ISO8601 format as String.
#
function ToDate($_)
{
  return $_.ToString("yyyy-MM-dd")
}

##
# Convert ClientID String to MAC address.
#
#
# @param _ The ClientID string to be converted.
#
# @returns String in MAC Address format (with dashes).
#
function ToMac($_)
{
  if ($_.length -eq 12)
  {
    $s = ($_ -split '(?<=\G.{2})') -join "-"
    return $s.Substring(0, $s.Length - 1)
  }
}

##
# Minify objects.
#
# This function takes an @p InputObject (via parameter or pipeline) and minifies
# it. This means, all properties with no value will be discarded. This
# essentially is required for minifying a generated JSON file before being
# dumped.
#
#
# @param InputObject The PSObject to be minified.
#
# @returns The minified object.
#
function Minify
{
  [CmdletBinding()]
  Param(
    [Parameter(Mandatory, ValueFromPipeline)] [PSObject[]] $InputObject
  )

  Process {
    Foreach ($_ in $InputObject)
    {
      # Get all properties, which have values, that cast to boolean true. This
      # excludes null, integer zero and empty strings.
      #
      # NOTE: This also excludes floating point zero (0.0) for percentages.
      #       However, this is okay for visualization, as the graphs won't be
      #       shown in this case, indicating either no data is available or an
      #       object is completly empty.
      $NonEmptyProperties = $_.psobject.Properties `
        | Where-Object {$_.Value} `
        | Select-Object -ExpandProperty Name

      # Return a minified version of the object, including the non-null
      # properties only.
      $_ | Select-Object -Property $NonEmptyProperties
    }
  }
}

##
# Write data to an API collection file.
#
# This function takes some data as @p InputObject, enahnces it and dumps a JSON
# representation into the specified @p FilePath.
#
#
# @param InputObject The PSObject to be stored.
# @param FilePath The destination path where to save the generated JSON file.
#
function Write-ApiFile
{
  [CmdletBinding()]
   Param(
    [Parameter(Mandatory, ValueFromPipeline)] [PSObject[]] $InputObject,
    [Parameter(Mandatory)] [String] $FilePath
  )

  # As this function doesn't simply process the items of the InputObject, but
  # needs to dump all of them as JSON file, a temporary storage is required for
  # holding each of them. At each iteration, this storage will be filled.
  begin {
    $items = [System.Collections.ArrayList]@()
  }
  process {
    $items.Add($InputObject) | Out-Null
  }

  # When all items have been added to the internal buffer, optimize the list and
  # dump it as JSON file to the desired destination.
  #
  # NOTE: The following commands require the variable '$dst' to be set. Usually
  #       this is the case when being called from the main loop below.
  end {
    $file = Join-Path -Path $dst -ChildPath $FilePath
    $items `
      | Minify `
      | ConvertTo-Json -AsArray -EnumsAsStrings -Compress `
      | Out-File -FilePath $file
  }
}


# ====
# Main
# ====

$commonProperties = `
  @{ Name = "owner";           Expression = { $_.Owner } },
  @{ Name = "description";     Expression = { $_.Description } },
  @{ Name = "scope";           Expression = { $_.AccessScopePath.Remove(1,7) }},
  @{ Name = "percentAssigned"; Expression = { [int]$_.PercentageAssigned } },
  @{ Name = "percentUtilized"; Expression = { [int]$_.PercentageUtilized } },
  @{ Name = "network";         Expression = { $_.NetworkId } },
  @{ Name = "site";            Expression = { $_.NetworkSite ??
                                              $_.CustomFields[$SiteField] } }

foreach ($version in ('IPv4', 'IPv6'))
{
  # Generate the IP-version-dependent path for all API collection files, which
  # will be generated below. The path will be created, if it's not available.
  $dst = Join-Path -Path $Path -ChildPath $version.Substring(2, 2)
  New-Item -ItemType 'directory' -Force -Path $dst | Out-Null


  # =========
  # API files
  # =========
  #
  # The following commands will generate the API files. A set of common
  # properties will be applied to all collections, even if not all of them will
  # be available. However, the later will result in null-values, which will be
  # filtered out in 'Write-ApiFile'. Individual properties or ones, that have
  # name collisions, will be passed per-collection.

  $CommonParams = @{
    "AddressFamily" = $version
    "CimSession"    = $CimSession
  }

  Get-IpamBlock @CommonParams `
    | Select-Object -Property (
      $commonProperties +
      @(
        @{ Name = "rir";        Expression = { $_.Rir } },
        @{ Name = "received";   Expression = { ToDate($_.RirReceivedDate) } },
        @{ Name = "changed";    Expression = { ToDate($_.LastAssignedDate) } }
      ))
    | Write-ApiFile -FilePath "block.json"

  Get-IpamSubnet @CommonParams `
    | Select-Object -Property (
      $commonProperties +
      @(
        @{ Name = "name";       Expression = { $_.Name } },
        @{ Name = "vlan";       Expression = { $_.VlanId } }
      ))
    | Write-ApiFile -FilePath "subnet.json"

  Get-IpamRange @CommonParams `
    | Select-Object -Property (
      $commonProperties +
      @(
        @{ Name = "ip_first";   Expression = { [String]$_.StartAddress } },
        @{ Name = "ip_last";    Expression = { [String]$_.EndAddress } },
        @{ Name = "gateway";    Expression = { $_.Gateway } },
        @{ Name = "assignment"; Expression = { $_.AssignmentType } },
        @{ Name = "managed";    Expression = { $_.ManagedByService } },
        @{ Name = "assigned";   Expression = { ToDate($_.AssignedDate) } }
      ))
    | Write-ApiFile -FilePath "range.json"

  Get-IpamAddress @CommonParams `
    | Foreach-Object {
      if (!$_.DeviceName)  { $_.DeviceName  = $_.ReservationName }
      if (!$_.MacAddress)  { $_.MacAddress  = ToMac($_.ClientID) }
      if (!$_.Description) { $_.Description = $_.ReservationDescription }
      return $_
      }
    | Select-Object -Property (
      $commonProperties +
      @(
        @{ Name = "ip";         Expression = { [String]$_.IpAddress } },
        @{ Name = "name";       Expression = { $_.DeviceName } },
        @{ Name = "mac";        Expression = { $_.MacAddress } },
        @{ Name = "type";       Expression = { $_.DeviceType } },
        @{ Name = "asset";      Expression = { $_.AssetTag } },
        @{ Name = "serial";     Expression = { $_.SerialNumber } },
        @{ Name = "assigned";   Expression = { ToDate($_.AssignmentDate) } },
        @{ Name = "expires";    Expression = { ToDate($_.ExpiryDate) } }
      ))
    | Write-ApiFile -FilePath "ip.json"
}
