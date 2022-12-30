/* This file is part of IPAM Web.
 *
 * Copyright (c) Alexander Haase <ahaase@alexhaase.de>
 *
 * This project is licensed under the MIT License. For the full copyright and
 * license information, please view the LICENSE file that was distributed with
 * this source code.
 */

import ipaddr from 'ipaddr.js';
import { IpRange } from './range';


/**
 * IPAM API class.
 *
 * This class is responsible for fetching and parsing the IPAM data from JSON
 * files. Data can be filtered and specific objects queried.
 *
 * @note Most methods are static, because they're just a collection of functions
 *       calling the API. They're not maintaining an internal state (yet).
 */
export class IPAM
{
  /**
   * Get the IP version of an IP object.
   *
   * This method gets the IP version of an IP object in the format the API
   * requires for generating the specific URL.
   *
   *
   * @param ip The IP object to be checked.
   *
   * @returns The IP version in API format. Will be either 'v4' or 'v6'.
   */
  static ipVersion(ip)
  {
    /* As ipaddr.js already has a similar function, this one will be used and
     * the returned string simply put in the right format. */
    return ip.kind().replace('ip', '');
  }

  /**
   * Fetch data via API.
   *
   * This method fetches a specific @p file for objects of a given @p ipVersion
   * for the client. It's used as abstraction, so clients don't need to resolve
   * the URL and parse the data retrieved.
   *
   * @note If the API returns an error 404 (e.g. no v6 files available), this
   *       method returns an empty array. This allows the callee to simply see
   *       this as empty collection instead of handling errors.
   *
   * @note Results fetched from the API won't be cached, as a single page will
   *       fetch each API resource usually once only.
   *
   *
   * @param ipVersion The IP version, the file should be fetched for. Must be
   *                  either 'v4' or 'v6'.
   * @param file The file to be fetched.
   *
   * @returns Promise to fetch the file.
   */
  static fetch(ipVersion, file)
  {
    return fetch(['', 'api', ipVersion, file].join('/'))
      /* If the API returns an error 404, don't throw an error, but simply use
       * an empty array instead, to mimic an empty collection. As the following
       * functions will parse the readonly response body as JSON, this simply
       * can be achieved by overriding the 'json()' method. */
      .then(response => {
        if (response.status == 404) response.json = () => [];
        return response;
      })

      /* Parse the retrieved data to decode JSON as JavaScript object, which is
       * simple to handle instead. */
      .then(response => response.json());
  }

  /**
   * Fetch an IP address object.
   *
   * This method searches the API for a specific IP address object and returns
   * it.
   *
   *
   * @param ip The IP to be fetched.
   *
   * @returns Promise to fetch the data.
   */
  static fetchIp(ip)
  {
    return this.fetch(this.ipVersion(ip), 'ip.json')
      .then(response => response.find((item) => item.ip === ip.toString()));
  }

  /**
   * Enrich an IP range with additional data.
   *
   * This method adds metadata to @p data composed from other fields of an
   * existing IP range.
   *
   *
   * @param data Data to be enriched.
   *
   * @returns Enriched dataset.
   */
  static enrichRange(data)
  {
    if (data)
      data.range = new IpRange(
        ipaddr.process(data.ip_first),
        ipaddr.process(data.ip_last));
    return data;
  }

  /**
   * Fetch an IP range object.
   *
   * This method searches the API for a specific IP range object and returns it.
   *
   *
   * @param range The IP range to be fetched.
   *
   * @returns Promise to fetch the data.
   */
  static fetchRange(range)
  {
    return this.fetch(this.ipVersion(range.first), 'range.json')
      .then(response => response.find(
        (item) => {
          return (item.ip_first == range.first) && (item.ip_last == range.last);
        }))
      .then(this.enrichRange);
  }

  /**
   * Fetch an IP range by one of its IPs.
   *
   * This method searches the API for an IP range that contains @p ip and
   * returns it.
   *
   *
   * @param ip The IP to be searched an IP range for.
   *
   * @returns Promise to fetch the data.
   */
  static fetchRangeByIp(ip)
  {
    return this.fetch(this.ipVersion(ip), 'range.json')
      .then(response => response.find(
        (item) => {
          let range = new IpRange(
            ipaddr.parse(item.ip_first),
            ipaddr.parse(item.ip_last));
          return range.match(ip);
        }))
      .then(this.enrichRange);
  }

  /**
   * Enrich a subnet with additional data.
   *
   * This method adds metadata to @p data composed from other fields of an
   * existing subnet.
   *
   *
   * @param data Data to be enriched.
   *
   * @returns Enriched dataset.
   */
  static enrichSubnet(data)
  {
    if (data)
      /* For subnets, the 'owner' field can be used for defining an external
       * service to be used for IP lookups (e.g. for a VPN managing its IP range
       * on its own). If found, the following lines will transform the text into
       * the URL to be used for lookup. */
      if ('owner' in data && data.owner.startsWith('lookup:'))
      {
        data.lookup_url = data.owner.replace('lookup:', '');
        delete data.owner;
      }
    return data;
  }

  /**
   * Fetch a subnet by one of its IPs.
   *
   * This method searches the API for a subnet that contains @p ip and returns
   * it.
   *
   *
   * @param ip The IP to be searched a subnet for.
   *
   * @returns Promise to fetch the data.
   */
  static fetchSubnetByIp(ip)
  {
    return this.fetch(this.ipVersion(ip), 'subnet.json')
      .then(response => response.find(
        (item) => ip.match(ipaddr.parseCIDR(item.network))
        ))
      .then(this.enrichSubnet);
  }
}
