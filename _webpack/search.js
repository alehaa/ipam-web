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
      return '/lookup/ip.html';
    if (q instanceof IpRange)
      return '/lookup/range.html';
    if (Query.isSubnet(q))
      return '/lookup/subnet.html';

    /* In any other case, no redirect to a specific lookup page is possible and
     * the generic search result page will be used instead. */
    return '/search.html';
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
    window.location = Page.toResourceUrl(
      IPAM_BASE_URL + this.getResourceTypeUrl(query),
      encodeURIComponent(query));
  }

  /**
   * Add static metadata for search datasets.
   *
   *
   * @param type The datatype to be applied on the dataset.
   *
   * @returns Anonymous function to enrich the data.
   */
  static toSearchData(type)
  {
    return (data) => {
      data['_'] = type;
      return data;
    };
  }

  /**
   * Convert a dataset to search result.
   *
   * This method takes a given search result and transforms it into a search
   * result representation required by the search result list page.
   *
   *
   * @param data The search result to be converted.
   *
   * @returns The search result representation.
   */
  static toSearchResult(data)
  {
    const typeMap = {
      'ip': {
        'title': 'IP',
        'index': 'ip',
        'link':  '/lookup/ip.html',
        },
      'block': {
        'title': 'Block',
        'index': 'network',
        'link':  '/lookup/block.html',
        },
    };

    /* Map the search result according to the mapping defined above. Attributes
     * will be processed, if necessary. */
    const type = typeMap[data['_']]
    const name = data[type.index]
    return {
      'type': type.title,
      'name': name,
      'link': Page.toResourceUrl(IPAM_BASE_URL + type.link, name),
      'data': data['res'].join('<br/>'),
    }
  }

  /**
   * Perform a new search query.
   *
   * This method searches all API data sources for a given search @p query. The
   * results will be returned in a specific data format just for printing the
   * search results.
   *
   *
   * @param query The query string to be searched.
   *
   * @returns Promise to fetch the data.
   */
  static search(query)
  {
    /* Helper function for matching the a specific value to input query. Resides
     * in this method to have access for query parameter without explicitly
     * passing it. */
    function match(v)
    {
      if (v)
      {
        const expr = new RegExp(query, 'i');
        return String(v).match(expr) ?
          v.replace(expr, '<span class="bg-warning text-dark">$&</span>')
          : null;
      }

    }

    return Promise
      /* Gather all API data sources (IPv4 & IPv6) and enrich it ready to be
       * searched. Especially the type of data will be added for reference at
       * display time. */
      .all([
        IPAM.fetchIpAll().then(   r => r.map(this.toSearchData('ip'))),
        IPAM.fetchBlockAll().then(r => r.map(this.toSearchData('block'))),
      ])
      .then(response => response.flat())

      /* Filter the data for items with attributes matching the query. If an
       * attribute matches the query, it will be returned in the dataset to be
       * printed later. */
      .then(response => response.map((data) => {
          data['res'] = [
            match(data.name),
            match(data.type),
            match(data.asset),
            match(data.serial),
            match(data.site),
            match(data.scope),
            match(data.owner),
            match(data.description),
          ].filter(x => x);
          return data;
        }))
      .then(response => response.filter((data) => data.res.length > 0))

      /* Parse all matching results to be printed as search results. Therefore
       * most attributes will be dropped and specific parts highlighted. */
      .then(response => response.map(this.toSearchResult));
  }
}


/* If available at the current page, initialize the search form by attaching the
 * handler to its onSubmit event. */
const form = document.getElementById('search');
if (form)
  form.addEventListener('submit', e => Search.handleSearchForm(e));
