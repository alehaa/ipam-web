/* This file is part of IPAM Web.
 *
 * Copyright (c) Alexander Haase <ahaase@alexhaase.de>
 *
 * This project is licensed under the MIT License. For the full copyright and
 * license information, please view the LICENSE file that was distributed with
 * this source code.
 */

import {IpRange} from './range';
import {Page}    from './page';
import {Query}   from './query';


/**
 * Search class.
 *
 * This class is responsible for processing search queries and providing
 * matching results for them.
 */
export class Search
{
  /**
   * Get the URL for a specific resource queried.
   *
   *
   * @param q The resource to be queried.
   *
   * @returns The URL to access this resource. If no specific resource matches,
   *          a generic search result URL will be returned instead.
   */
  static getResourceTypeUrl(q)
  {
    /* First, handle all types of query objects, that have a specific type and
     * therefore a lookup page. */
    if (Query.isIP(q))
      return IPAM_BASE_URL + '/lookup/ip.html';
    if (q instanceof IpRange)
      return IPAM_BASE_URL + '/lookup/range.html';
    if (Query.isSubnet(q))
      return IPAM_BASE_URL + '/lookup/subnet.html';
  }

  /**
   * Handle a new search query.
   *
   * This method will handle a new search query, parse its input and redirect
   * the user to the most suitable page to answer the query.
   *
   *
   * @param event The form event to be handled.
   */
  static handleSearchForm(event)
  {
    /* First, disable the default event handling. Otherwise the browser will
     * refresh the current page because of the form submit. */
    event.preventDefault();

    /* Get the form data, process the query and redirect the user to a page
     * representing the query at best (i.e. the lookup pages). */
    const data = new FormData(event.target);
    const query = Query.parse(data.get('query'));
    window.location = Page.toResourceUrl(this.getResourceTypeUrl(query), query);
  }
}


/* If available at the current page, initialize the search form by attaching the
 * handler to its onSubmit event. */
const form = document.getElementById('search');
if (form)
  form.addEventListener('submit', e => Search.handleSearchForm(e));
