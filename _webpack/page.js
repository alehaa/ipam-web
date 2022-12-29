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
}
