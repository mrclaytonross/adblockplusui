/*
 * This file is part of Adblock Plus <https://adblockplus.org/>,
 * Copyright (C) 2006-present eyeo GmbH
 *
 * Adblock Plus is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * Adblock Plus is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adblock Plus.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

const {isPageWhitelisted} = require("./popup.utils.js");
const {$} = require("./dom");

// remember initial state to better toggle content
let toggleChecked;

module.exports = setupToggles;

function setupToggles(tab)
{
  const domain = $("#page-status .domain io-circle-toggle");
  const page = $("#page-status .page io-circle-toggle");

  domain.addEventListener("click", () =>
  {
    // when the domain is clicked it will either
    // whitelist or un-whitelist the whole domain,
    // and in both cases we should ignore page changes
    // - - -
    // use the domain.state instead of its checked attribute
    // as the attribute is sensible to animations while the state
    // is set only after, so it's the source of truth, avoiding
    // inconsistent behavior with Firefox or Edge
    setPageStateAfterDomain(page, !domain.state.checked);
  });

  $("#page-refresh button").addEventListener("click", () =>
  {
    browser.tabs.reload(tab.id).then(window.close);
  });

  isPageWhitelisted(tab).then(whitelisted =>
  {
    if (whitelisted)
    {
      document.body.classList.add("disabled");
      $("#block-element").disabled = true;

      // avoid triggering an event on this change
      domain.setState({checked: false}, false);
      domain.checked = false;
      setPageStateAfterDomain(page, false);
    }
    toggleChecked = domain.checked;
  });

  domain.addEventListener("change", () =>
  {
    const {checked} = domain;
    document.body.classList.toggle("refresh", toggleChecked !== checked);
    browser.runtime.sendMessage({
      type: `filters.${checked ? "unwhitelist" : "whitelist"}`,
      tab
    });
  });

  page.addEventListener("change", () =>
  {
    document.body.classList.toggle("refresh");
    browser.runtime.sendMessage({
      type: `filters.${page.checked ? "unwhitelist" : "whitelist"}`,
      singlePage: true,
      tab
    });
  });
}

function setPageStateAfterDomain(page, checked)
{
  page.setState({checked}, checked);
  page.checked = checked;
  page.disabled = !checked;
}
