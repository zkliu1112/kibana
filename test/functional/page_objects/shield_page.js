/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

export function ShieldPageProvider({ getService, getPageObjects }) {
  const testSubjects = getService('testSubjects');
  const log = getService('log');
  const find = getService('find');
  const provisionedEnv = getService('provisionedEnv');
  const PageObjects = getPageObjects(['header', 'common', 'settings', 'visualize']);

  const regularLogin = async (user, pwd) => {
    await testSubjects.setValue('loginUsername', user);
    await testSubjects.setValue('loginPassword', pwd);
    await testSubjects.click('loginSubmit');
    await find.waitForDeletedByCssSelector('.kibanaWelcomeLogo');
  };

  const samlLogin = async (user, pwd) => {
    try {
      await find.setValue('input[name="email"]', user);
      await find.setValue('input[type="password"]', pwd);
      await find.clickByCssSelector('.auth0-label-submit');
    } catch (err) {
      log.debug(`${err} \nFailed to find Auth0 login page, trying the Auth0 last login page`);
      await find.clickByCssSelector('.auth0-lock-social-button');
    }
  };

  class ShieldPage {

    async login(user, pwd) {
      if (provisionedEnv.REMOTE_SESSION_URL) {
        const [samlUser, samlPass] = parse(provisionedEnv.KIBANAURL);
        await samlLogin(samlUser, samlPass);
        return;
      }

      await regularLogin(user, pwd);
    }

    async logoutLogin(user, pwd) {
      await this.logout();
      await PageObjects.common.sleep(3002);
      await this.login(user, pwd);
    }

    async logout() {
      await testSubjects.click('userMenuButton');
      await PageObjects.common.sleep(500);
      await testSubjects.click('logoutLink');

      // for new K7 app menu
      // await this.remote.setFindTimeout(defaultFindTimeout)
      //     .findByCssSelector('#headerUserMenu')
      //     .click();
      //
      // await PageObjects.common.sleep(1111);
      // await this.remote.setFindTimeout(defaultFindTimeout)
      //     .findByCssSelector('.euiLink[href="/logout"]')
      //     .click();
      log.debug('### found and clicked log out--------------------------');
      await PageObjects.common.sleep(8002);
    }
  }

  return new ShieldPage();
}
function parse(x) {
  const { username, password } = new URL(x);
  return [decodeURIComponent(username), password];
}
