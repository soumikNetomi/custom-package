/* eslint-disable */
import _ from 'lodash';
import { ROLE, UPDATED_VERSION } from './constant/roles.js';

const PermissionKeys = {
  YES: 'YES',
  NO: 'NO',
  ALLOW: 'ALLOW',
  DENY: 'DENY',
};

class PassportAccess {
  constructor(_entity) {
    this.entity = _entity;
    this.currentBotId = '';
    this.analyzePath = {};
  }

  /**
   * Display a textual summary of what this entity can do or not
   * @param lineBreak
   * @returns
   */
  summarize(lineBreak = '\n') {
    let text = [];
    const roles = this.entity.roles;
    const policies = _.chain(roles).map('policies').flatten().valueOf();

    const rolesString = _.map(roles, 'name').join(',');
    text.push(`\nRoles (${roles.length}); [${rolesString}]`);
    text.push(`Policies (${policies.length})`);

    for (const p of policies) {
      for (const s of p.policy.statements || []) {
        if (s.allow) {
          text.push(`..${this.entity.email} CAN perform [${s.allow.actions}] on [${s.allow.resources}] thanks to Policy=[${p.name} (${p.description})]`);
        }
        if (s.deny) {
          text.push(`..${this.entity.email} CANNOT perform [${s.deny.actions}] on [${s.deny.resources}] thanks to Policy=[${p.name} (${p.description})]`);
        }
      }
    }

    return text.join(lineBreak);
  }

  summarizePolicy() {
    let text = ''
    const userBasedPolicy = this.entity?.policy?.statements || []
    const orgBasedPolicy = this.entity?.org?.policy?.statements || []
    text += `By User Policy :\n`
    if (!userBasedPolicy.length) text += `User does not have a policy.\n`
    text += this.generateText(userBasedPolicy)
    text += `\nBy Org Policy :\n`
    if (!orgBasedPolicy.length) text += `User's org does not have a policy.\n`
    text += this.generateText(orgBasedPolicy)
    text += `\nBy Role Policy :\n`
    if (!orgBasedPolicy.length) text += `User's role does not have a policy.\n`
    for (const role of this.entity.roles) { 
      text += `  as ${role.name}\n`
      for (const p of role.policies) { 
        text += this.generateText(p.policy.statements)
      }
    }
    return text;
  }

  generateText(statements) { 
    let text = ''
    for (const stm of statements) {
      if (stm.effect === 'allow' || stm.effect === 'deny') {
        text += `\t- ${this.entity.email} ${stm.effect === 'allow' ? 'CAN' : 'CANNOT'} perform:\n\t\t- Actions: [${stm.actions.join(', ')}] \n\t\t- Resources: [${stm.resources.join(', ')}]\n`
      }
    }
    return text
  }

  /**
   * Find matching resources for a given resourcePath
   * @param resourcePath
   * @param resources
   * @returns
   */
  matchResource(resourcePath, resources) {
    const matchingResources = [];
    for (const r0 of resources) {
      // convert the resource to valid regex pattern
      const r1 = `^${r0.replace('*', '.*')}$`;
      const key = `......matching R=[${resourcePath}] against: [${r1}]`;
      this.analyzePath[key] = PermissionKeys.NO;
      const m0 = resourcePath.match(r1);
      if (m0) {
        // add the resource, if match found
        matchingResources.push(r0);
        this.analyzePath[key] = PermissionKeys.YES;
      }
    }
    return matchingResources;
  }

  /**
   * Find matching actions for a given Action
   * @param action
   * @param actions
   * @returns
   */
  matchAction(action, actions) {
    const matchingActions = [];
    for (const a0 of actions) {
      // convert the action to valid regex pattern
      const a1 = `^${a0.replace('*', '.*')}$`;
      const key = `........matching A=[${action}] against: [${a1}]`;
      this.analyzePath[key] = PermissionKeys.NO;
      const m0 = action.match(a1);
      if (m0) {
        // add the action, if match found
        matchingActions.push(a0);
        this.analyzePath[key] = PermissionKeys.YES;
      }
    }
    return matchingActions;
  }

  /**
   * Does this entity have roles defined?
   * @returns true | false
   */
  exists() {
    if (_.isEmpty(this.entity?.roles)) {
      return false;
    }
    return true;
  }

  isPassportAdmin() {
    if (_.isEmpty(this.entity?.roles)) {
      return false;
    }
    // Check if the current user is a superadmin
    const isSuperadmin = this.entity.roles.some((role) => role.userRoles.some((userRole) => userRole.roleId === ROLE.SUPER_ADMIN_ROLE_ID));
    return isSuperadmin;
  }

  hasAccess(resourcePath, action, selectedBotId) {
    // determine v1 or v2 
    const entityVersion = this.entity.roles[0]?.policies[0]?.policy?.version || '';
    const v1 = new Date(entityVersion) < new Date(UPDATED_VERSION);
    return v1 ? this.#hasAccess1(resourcePath, action, selectedBotId) : this.#hasAccess2(resourcePath, action, selectedBotId);
  }

  /**
   * For a given Resource Path string and an Action, determines whether user has access or not
   * @param resourcePath : string
   * @param action : string
   * @returns
   */
  #hasAccess1(resourcePath, action, selectedBotId) {
    if (_.isEmpty(this.entity)) {
      return false;
    }
    const resourceActionId = `${resourcePath}-${action}`;
    // console.log('verifying passport.hasAccess()', this.entity.uuid, resourceActionId)
    const matchingPoliciesWithResources = [];
    let matchingPolicies = [];
    this.analyzePath = {};
    const currentBotId = selectedBotId ? selectedBotId : this.currentBotId;
    // Iterate through each role
    for (const role of this.entity.roles) {
      // Filter roles based on the bot id
      const matchingUserRoles = role.userRoles.filter((userRole) => {
        return (userRole.botId === currentBotId || userRole.roleId === ROLE.SUPER_ADMIN_ROLE_ID || userRole.roleId === ROLE.ORG_ADMIN_ROLE_ID) && userRole.active === 1;
      });
      // If no matching user roles, skip to the next role
      if (matchingUserRoles.length === 0) {
        continue;
      }
      this.analyzePath['applying role'] = `${role.name} (${role.description})`;
      // Iterate through each policy in a given role
      for (const policyDef of role.policies) {
        this.analyzePath['..inspecting policy'] = `${policyDef.name} (${policyDef.description})`;
        for (const statement of policyDef.policy.statements) {
          // First match the resources
          const key1 = `....matching resource=[${resourcePath}] in statement=(${statement.name})`;
          this.analyzePath[key1] = PermissionKeys.NO;
          let allowedResources = [];
          let deniedResources = [];
          // Check for allow: {} statements
          if (statement.allow) {
            allowedResources = this.matchResource(resourcePath, statement.allow.resources);
            if (allowedResources?.length > 0) {
              matchingPoliciesWithResources.push(statement.name);
              this.analyzePath[key1] = PermissionKeys.YES;
            }
          }
          // Check for deny: {} statements
          if (statement.deny) {
            deniedResources = this.matchResource(resourcePath, statement.deny.resources);
            if (deniedResources?.length > 0) {
              matchingPoliciesWithResources.push(statement.name);
              this.analyzePath[key1] = PermissionKeys.YES;
            }
          }

          // Second, match the actions
          if (this.analyzePath[key1] === PermissionKeys.YES) {
            let key2 = `......matching action=[${action}] in statement: (${statement.name})`;
            this.analyzePath[key2] = PermissionKeys.DENY;
            let allowedActions = [];
            let deniedActions = [];
            // Check for allow: {} statements
            if (statement.allow) {
              allowedActions = this.matchAction(action, statement.allow.actions);
              if (allowedActions?.length > 0) {
                // this policy allows the action on this resourcePath, so ALLOW the resourceActionId
                matchingPolicies.push(resourceActionId);
                this.analyzePath[key2] = PermissionKeys.ALLOW;
              }
            }
            // Check for deny: {} statements
            if (statement.deny) {
              deniedActions = this.matchAction(action, statement.deny.actions);
              if (deniedActions?.length > 0) {
                // this policy denies the action on this resourcePath, so Remove the resourceActionId
                // Deny takes preference over Allow
                matchingPolicies = matchingPolicies.filter((x) => x !== resourceActionId);
                this.analyzePath[key2] = PermissionKeys.DENY;
              }
            }
          }
        }
      }
    }

    this.analyzePath[`Polices matched for [${resourcePath}] (${matchingPoliciesWithResources.length})`] = matchingPoliciesWithResources;
    const accessText = matchingPolicies?.length > 0 ? PermissionKeys.ALLOW : PermissionKeys.DENY;
    this.analyzePath[`FINAL: Can ${this.entity.email} perform (${action}) on (${resourcePath})?`] = accessText;

    // logger.debug("Passport.hasAccess explanation", this.analyzePath) //  - use for local debug only

    // Return true if policies are found, false if not
    return matchingPolicies?.length > 0;
  }

  #hasAccess2(resourcePath, action, selectedBotId) {
    const currentBotId = selectedBotId ? selectedBotId : this.currentBotId; //like:-  "f9d79b7a-f3d1-4855-9b51-c74d00c82bcc"
    let isUserHasAccess = false;

    // Check statements in user-based policy
    const userBasedStatements = this.entity.policy?.statements || [];
    for (const statement of userBasedStatements) {
      if (statement.botIds?.length) {
        const matchBotId = statement.botIds?.some((botId) => botId === currentBotId);
        if (!matchBotId) continue;
      }
      // Check if the resource and action match
      const matchResource = statement.resources?.some((r0) => resourcePath.match(`^${r0.replace('*', '.*')}$`));
      if (!matchResource) continue;
      const matchAction = statement.actions?.some((a0) => action.match(`^${a0.replace('*', '.*')}$`));
      if (!matchAction) continue;
      // If any statement denies access, return false immediately
      if (statement.effect === 'deny') return false;
      // If a statement allows access, mark it as such
      if (statement.effect === 'allow') isUserHasAccess = true;
    }
    // Return true if any statement allowed access
    if (isUserHasAccess) return isUserHasAccess;

    // check statements in org Based policy
    const orgBasedSatements = this.entity.org?.policy?.statements || [];
    for (const statement of orgBasedSatements) {
      if (statement.roles && statement.roles.length) {
        const matchRole = statement.roles?.some((role) => this.isRoleMatched(this.entity, role, currentBotId));
        if (!matchRole) continue;
      }
      // Check if the resource and action match
      const matchResource = statement.resources?.some((r0) => resourcePath.match(`^${r0.replace('*', '.*')}$`));
      if (!matchResource) continue;
      const matchAction = statement.actions?.some((a0) => action.match(`^${a0.replace('*', '.*')}$`));
      if (!matchAction) continue;
      // If any statement denies access, return false immediately
      if (statement.effect === 'deny') return false;
      if (statement.effect === 'allow') isUserHasAccess = true;
    }

    if (isUserHasAccess) return isUserHasAccess;

    // check statements in role based policy
    for (const role of this.entity.roles) {
      // find role based on the bot id
      const matchingUserRoles = role.userRoles.find((userRole) => {
        return (
          (userRole.botId === currentBotId || userRole.roleId === ROLE.SUPER_ADMIN_ROLE_ID || (userRole.roleId === ROLE.ORG_ADMIN_ROLE_ID && userRole.org.id === this.entity.org.id)) &&
          userRole.active === 1
        );
      });
      // If no matching user roles, skip to the next role
      if (!matchingUserRoles) continue;

      // Iterate through each policy in a given role
      for (const policyDef of role.policies) {
        const roleBasedStatements = policyDef.policy.statements || [];
        for (const statement of roleBasedStatements) {
          // Check if the resource and action match
          const matchResource = statement.resources?.some((r0) => resourcePath.match(`^${r0.replace('*', '.*')}$`));
          if (!matchResource) continue;
          const matchAction = statement.actions?.some((a0) => action.match(`^${a0.replace('*', '.*')}$`));
          if (!matchAction) continue;
          // If any statement denies access, return false immediately
          if (statement.effect === 'deny') return false;
          if (statement.effect === 'allow') isUserHasAccess = true;
        }
      }
    }
    // Return true if policies are found, false if not
    return isUserHasAccess;
  }

  isRoleMatched(entity, role, botId) {
    return entity?.roles?.some((entityRole) => {
      if (entityRole.name === role) return entityRole?.userRoles?.some((ur)=> ur.botId === botId)
      return false
    })
  }

  setCurrentBotId(_currentBotId) {
    this.currentBotId = _currentBotId;
  }

  /**
   * Display the analysis
   * @returns analyzePath
   */
  getAnalyzePath() {
    return this.analyzePath;
  }
}

export default PassportAccess;
