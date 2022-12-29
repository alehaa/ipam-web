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
}
