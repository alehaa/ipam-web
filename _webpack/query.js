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
 * Query class.
 *
 * This class is responsible for parsing any user input data, especially the
 * query parameter.
 */
export class Query
{
  /**
   * Global query parameter.
   *
   * The constructor will store the global query parameter passed via URL in
   * this variable, so it's accessible, even if the object will be used for
   * parsing other query strings during its lifetime.
   *
   * Its default is 'null', so its not 'undefined', if no query parameter has
   * been set in the URL or its content couldn't be parsed.
   */
  global = null;

  /**
   * Constructor.
   */
  constructor()
  {
    /* All queries of IPAM Web come from a static query parameter across all
     * pages. Only pages not serving dynamic content won't have this query
     * parameter set.
     *
     * For processing, first parse the query parameters, before checking if a
     * query has been passed. If not, this class won't process any data and
     * stop execution of this method. */
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q === null)
      return;

    /* Parse the query parameter string to an appropriate object and store it as
     * global query. This allows additional queries to be parsed by this class,
     * e.g. for resolving a search query before sending the request. */
    try {
      this.global = this.constructor.parse(q);
    } catch {}
  }

  /**
   * Parse a query string.
   *
   * This method parses a given query string into an appropriate object, that
   * represents the query at best. This allows distinguishing the query by its
   * object type.
   *
   *
   * @param q The query string to be parsed.
   *
   * @returns The object representing the query string at best.
   */
  static parse(q)
  {
    /* The query can have these types of data: IP, IP Range, IP subnet, integer
     * (VLAN ID) or string. As the complex datatypes will be represented by
     * objects, first check these and convert the query into them, if validation
     * did pass. */

    if (ipaddr.isValid(q))
      return ipaddr.process(q);

    if (IpRange.isValid(q))
      return IpRange.process(q);

    try { // Subnet has no isValid method
      return ipaddr.parseCIDR(q);
    } catch {}


    /* If query is not one of the known objects above, just it as plain string.
     * Usually the search form will handle this case. */
    return q.trim();
  }

  /**
   * Check whether a query is an IP or not.
   *
   *
   * @param ip The IP to be checked.
   *
   * @returns True, if @p ip is a valid IP address object, otherwise false.
   */
  static isIP(ip)
  {
    return (ip instanceof ipaddr.IPv4) || (ip instanceof ipaddr.IPv6);
  }

  /**
   * Check whether a query is an IP subnet or not.
   *
   *
   * @param subnet The subnet to be checked.
   *
   * @returns True, if @p subnet is a valid IP subnet object, otherwise false.
   */
  static isSubnet(subnet)
  {
    return (subnet instanceof Array) && this.isIP(subnet[0]);
  }
}
