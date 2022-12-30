/* This file is part of IPAM Web.
 *
 * Copyright (c) Alexander Haase <ahaase@alexhaase.de>
 *
 * This project is licensed under the MIT License. For the full copyright and
 * license information, please view the LICENSE file that was distributed with
 * this source code.
 */

import ipaddr from 'ipaddr.js';


/**
 * IP range class.
 *
 * This class extends the 'ipaddr.js' module for IP ranges. In contrast to
 * subnets, an IP range can start and end at any given IP of a subnet without
 * matching a specific CIDR mask.
 */
export class IpRange
{
  /**
   * Constructor.
   *
   *
   * @param first First IP of the IP range.
   * @param last Last IP of the IP range.
   */
  constructor(first, last)
  {
    this.first = first;
    this.last = last;
  }

  /**
   * Check if a string is a valid IP range.
   *
   *
   * @param str The string to be checked.
   *
   * @returns True, if string is a valid IP range, otherwise false.
   */
  static isValid(str)
  {
    const ips = str.split('-');
    return (ips.length == 2) && ips.every(ipaddr.isValid);
  }

  /**
   * Convert an IP range string into a valid IP range object.
   *
   *
   * @param str The string to be parsed.
   *
   * @returns The converted IP range object.
   */
  static process(str)
  {
    const ips = str.split('-');
    return new this(ipaddr.process(ips[0]), ipaddr.process(ips[1]));
  }

  /**
   * Compare an @p ip to be in the IP range.
   *
   * This method takes an @p ip and @p rangeIp and compares them by @p cmp to
   * check, whether the IP is in the range. Needs to be called multiple times
   * for checking boundaries.
   *
   *
   * @param ip IP to be checked.
   * @param rangeIp Boundary IP of the range.
   * @param cmpFunc Function to compare both IPs.
   *
   * @returns True, if @p ip is in boundary, otherwise false.
   */
  static cmp(ip, rangeIp, cmpFunc)
  {
    /* Iterate over parts of both IPs. All parts that are equal will be skipped,
     * as they can't be used for comparison. */
    const a = ip.toByteArray();
    const b = rangeIp.toByteArray();
    for (let i in a)
    {
      if (a[i] == b[i])
        continue;

      /* If both parts aren't equal, they can be used for comparison. The result
       * will be returned to indicate whether the IP hit the boundary. */
      return cmpFunc(b[i], a[i]);
    }

    /* If all parts are equal, the IP is definitely in the range and true can be
     * returned. */
    return true;
  }

  /**
   * Convert IP range to string.
   *
   *
   * @returns String representation of the current IP range of this object.
   */
  toString()
  {
    return this.first + ' - ' + this.last;
  }

  /**
   * Check if an IP matches the IP range.
   *
   *
   * @param ip IP to be checked.
   *
   * @returns True, if @p ip is in range, otherwise false.
   */
  match(ip)
  {
    return (this.constructor.cmp(ip, this.first, (i,j) => i < j) &&
            this.constructor.cmp(ip, this.last,  (i,j) => i > j));
  }
}
