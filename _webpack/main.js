/* This file is part of IPAM Web.
 *
 * Copyright (c) Alexander Haase <ahaase@alexhaase.de>
 *
 * This project is licensed under the MIT License. For the full copyright and
 * license information, please view the LICENSE file that was distributed with
 * this source code.
 */

import {IPAM}  from './ipam.js';
import {Page}  from './page.js';
import {Query} from './query.js';


// =====
// Setup
// =====

const query = new Query();




// ==============
// Site functions
// ==============
//
// Functions listed below are the interface for the HTML site being deployed by
// IPAM Web. Classes of other modules won't be accessed directly.

/**
 * Lookup an IP address.
 *
 * This function looks up an IP address passed in the global query string and
 * displays its information along with related objects.
 */
export function lookup_ip()
{
  /* Evaluate the query and check, whether it's a valid IP object. If not, this
   * method can't handle the query and an error will be displayed instead. */
  const q = query.global;
  if (!Query.isIP(q))
  {
    Page.error('The given query string is not a valid IP address.');
    return;
  }

  /* Process the query, fetch all data and fill the related data into the cards
   * and tables at the page. */
  Page.setTitle(q);
  IPAM.fetchIp(q).then(        data => Page.fillCard('ip',     data));
  IPAM.fetchRangeByIp(q).then( data => Page.fillCard('range',  data));
  IPAM.fetchSubnetByIp(q).then(data => Page.fillSubnet(data, q));
}
