/* This file is part of IPAM Web.
 *
 * Copyright (c) Alexander Haase <ahaase@alexhaase.de>
 *
 * This project is licensed under the MIT License. For the full copyright and
 * license information, please view the LICENSE file that was distributed with
 * this source code.
 */

/**
 * Page control class.
 *
 * This class manages manipulating the HTML contents of the current site. It
 * will be used to fill the data obtained by IPAM queries.
 *
 * @note Most methods are static, because they're just a collection of DOM
 *       manipulating functions with no state maintained within the class.
 */
export class Page
{
  /**
   * Hide an element.
   *
   *
   * @param id ID of the element to be hidden.
   */
  static hide(id)
  {
    document.getElementById(id).classList.add('d-none');
  }

  /**
   * Show an element.
   *
   *
   * @param id ID of the element to be shown.
   */
  static show(id)
  {
    document.getElementById(id).classList.remove('d-none');
  }

  /**
   * Set the content of a given HTML element.
   *
   *
   * @param id ID of the element to be manipulated.
   * @param value The content to be set.
   */
  static setContent(id, value)
  {
    document.getElementById(id).innerHTML = value;
  }

  /**
   * Set the title of the current page.
   *
   * This method sets the document title and heading for the current page.
   *
   *
   * @param title The title to be set.
   */
  static setTitle(title)
  {
    document.title = 'IPAM | ' + title;
    this.setContent('title', title);
  }

  /**
   * Display an error message.
   *
   * This method will display an error message and hide all other elements, as
   * processing of them will stop usually.
   *
   *
   * @param message The message to be displayed.
   */
  static error(message)
  {
    this.setTitle('Error');
    this.setContent('error.message', message);

    this.hide('content');
    this.show('error');
  }

  /**
   * Fill a data card with information.
   *
   * This method takes a given dataset @p data and fills the key-value-pairs
   * into table cells of a @p card equally named.
   *
   *
   * @param card The card to be filled.
   * @param data The data to be filled in.
   */
  static fillCard(card, data)
  {
    /* Data will be processed only, if data has been passed (and previously
     * found via API). This step is necessary to allow using this function
     * without checking the data and always hide the spinner (below), to
     * indicate data is not being loaded / processed anymore. */
    if (data) {
      /* For each entry in 'data', search for an equally named table cell, where
       * the data can be filled into. If the related cell is not available, just
       * ignore it. */
      for (var key in data)
      {
        try {
          this.setContent('ipam.' + card + '.' + key, data[key]);
        } catch {}
      }

      /* Show the div containing the data previously set, so its finally visible
       * to the user. */
      this.show('card-' + card + '-data');
    }

    /* Finally, hide the spinner, as no data is being processed anymore. This
     * will be done, even if no data could be found, to indicate this status to
     * the user and doesn't wait indefinitely. */
    this.hide('card-' + card + '-spinner');
  }

  /**
   * Fill the subnet card with data.
   *
   * Despite other cards, the one for subnets needs special handling, as its
   * data can affect others for external lookup IP assignments. This method will
   * handle all necessary steps.
   *
   *
   * @param data The data to be filled in the card.
   * @param ip The current IP being queried, used for the external lookup link.
   */
  static fillSubnet(data, ip)
  {
    this.fillCard('subnet', data);

    /* If an external lookup URL is defined, additional text and a lookup button
     * will be displayed. */
    if (data && 'lookup_url' in data)
    {
      const url = data.lookup_url.replace('%{ip}', ip);
      document.getElementById('ipam.ip.lookup').href = url;
      this.show('ip-lookup');
    }
  }
}
