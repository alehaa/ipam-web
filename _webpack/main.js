/* This file is part of IPAM Web.
 *
 * Copyright (c) Alexander Haase <ahaase@alexhaase.de>
 *
 * This project is licensed under the MIT License. For the full copyright and
 * license information, please view the LICENSE file that was distributed with
 * this source code.
 */

import {IPAM}    from './ipam';
import {IpRange} from './range';
import {Page}    from './page';
import {Query}   from './query';
import {Search}  from './search';


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
  IPAM.fetchIp(q).then(data => {
    Page.fillCard('ip', data);
    if (data.name)
      IPAM.fetchIpByName(data.name)
        .then(response => response.filter(item => item.ip != data.ip))
        .then(response => Page.addTableRows('ip', response));
  });
  IPAM.fetchRangeByIp(q).then( data => Page.fillCard('range',  data));
  IPAM.fetchSubnetByIp(q).then(data => Page.fillSubnet(data, q));
}

/**
 * Lookup an IP range.
 *
 * This function looks up an IP range passed in the global query string and
 * displays its information along with related objects.
 */
export function lookup_range()
{
  /* Evaluate the query and check, whether it's a valid IP range object. If not,
   * this method can't handle the query and an error will be displayed. */
  const q = query.global;
  if (!(q instanceof IpRange))
  {
    Page.error('The given query string is not a valid IP range.');
    return;
  }

  /* Process the query, fetch all data and fill the related data into the cards
   * and tables at the page. */
  Page.setTitle(q);
  IPAM.fetchRange(q).then(data => {
    Page.fillCard('range', data);
    Page.drawGraph(
      'utilization',
      (data && 'percentUtilized' in data) ? data.percentUtilized : null);
  });
  IPAM.fetchSubnetByIp(q.first).then(data => Page.fillSubnet(data, ''));
  IPAM.fetchIpOfRange(q).then(data => Page.addTableRows('ip', data));
}

/**
 * Lookup an IP subnet.
 *
 * This function looks up an IP subnet passed in the global query string and
 * displays its information along with related objects.
 */
export function lookup_subnet()
{
  /* Evaluate the query and check, whether it's a valid subnet object. If not,
   * this method can't handle the query and an error will be displayed. */
  const q = query.global;
  if (!Query.isSubnet(q))
  {
    Page.error('The given query string is not a valid subnet in CIDR format.');
    return;
  }

  /* Process the query, fetch all data and fill the related data into the cards
   * and tables at the page. */
  Page.setTitle(q);
  IPAM.fetchSubnet(q).then(data => {
    Page.fillSubnet(data, '');
    Page.drawGraph(
      'utilization',
      (data && 'percentUtilized' in data) ? data.percentUtilized : null);
  });
  IPAM.fetchBlockByIp(q[0]).then(data => Page.fillCard('block', data));
  IPAM.fetchRangeOfSubnet(q).then(data => Page.addTableRows('range', data));
}

/**
 * Lookup an IP block.
 *
 * This function is nearly identical to @function lookup_subnet, but will look
 * up an IP block instead of a subnet. It uses the block passed in the global
 * query string and displays related objects.
 *
 * @note The page being rendered will not have any information about the block
 *       itself (like assignment date), as there's not enough information to
 *       display why it would be a waste of space.
 */
export function lookup_block()
{
  /* Evaluate the query and check, whether it's a valid IP block object. If not,
   * this method can't handle the query and an error will be displayed. */
  const q = query.global;
  if (!Query.isSubnet(q))
  {
    Page.error('The given query string is not a valid subnet in CIDR format.');
    return;
  }

  /* Process the query, fetch all data and fill the related data into the cards
   * and tables at the page. */
  Page.setTitle(q);
  IPAM.fetchSubnetOfBlock(q).then(data => Page.addTableRows('subnet', data));
}

/**
 * Generate a list of all IP blocks.
 *
 * As IP blocks don't have a parent object, a list of them will be generated for
 * navigation.
 */
export function list_blocks()
{
  IPAM.fetchBlockAll().then(data => Page.addTableRows('block', data));
}

/**
 * Perform a new search query.
 *
 * This function is called from the search page and will be used to lookup all
 * search results of a given query.
 */
export function search()
{
  const q = query.global;

  /* Evaluate the query. If the query doesn't match a specific length, it will
   * be rejected and an error displayed instead. */
  document.getElementById('search').query.value = q;
  if (q.length < 3)
  {
    Page.error('Minimum search query length is 3.', false);
    return;
  }

  /* Gather all results and print them in the results table. Results won't be
   * sorted in any kind, they're simply printed in API dataset order. */
  Search.search(q).then(data => Page.addTableRows('search', data));
}
