/* This file is part of IPAM Web.
 *
 * Copyright (c) Alexander Haase <ahaase@alexhaase.de>
 *
 * This project is licensed under the MIT License. For the full copyright and
 * license information, please view the LICENSE file that was distributed with
 * this source code.
 */

/**
 * MAC address class.
 *
 * This class implements a representation of MAC addresses, allowing them to be
 * compared regardless of the format entered.
 */
export class MacAddress
{
  /**
   * Constructor.
   *
   *
   * @param str MAC address string.
   */
  constructor(str)
  {
    this.data = str
      .toUpperCase()
      .replace(new RegExp(/[.:-]/, 'g'), '');
  }

  /**
   * Check if a string is a valid MAC address.
   *
   *
   * @param str The string to be checked.
   *
   * @returns True, if string is a valid MAC address, otherwise false.
   */
  static isValid(str)
  {
    const regex = new RegExp(/^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})|(([0-9A-F]{4}.){2}[0-9A-F]{4})$/, 'i');
    return str && str.match(regex, 'i');
  }

  /**
   * Convert a MAC address string into a valid MAC address object.
   *
   *
   * @param str The string to be parsed.
   *
   * @returns The converted MAC address object.
   */
  static process(str)
  {
    return new this(str);
  }

  /**
   * Convert MAC address to string.
   *
   *
   * @returns String representation of the current MAC address of this object.
   */
  toString()
  {
    return this.data
      .replace(new RegExp(/(.{2})/,'g'),"$1:")
      .slice(0, -1);
  }
}
