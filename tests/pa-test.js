import PassportAccess from '../src/entitlements/passport-access.js';
import * as files from '../src/utils/files.js';
import * as log from '../src/utils/log.js';
import * as P from './policy-actions.js';

const dataDir = './fixtures';

let results = [];
let totalCases = 0;
let totalPassed = 0;
let totalFailed = 0;
const version = "v2";

const DENY = false;
const ALLOW = true;

function newPassportEntity(file) {
  const user = files.readJSONFile(dataDir, `${version}/${file}.json`);
  const entity = user.payload;
  const _P = new PassportAccess(entity);
  if (entity.defaultBotId) _P.setCurrentBotId(entity.defaultBotId)
  return _P
}

function testAccess(P, resourcePath, action, expected) {
  const received = P.hasAccess(resourcePath, action);
  log.info('scanned for:', resourcePath, action, `expect=${received ? 'ALLOW' : 'DENY'}`);
  // log.info("Summary", P.summarize())
  log.info('Explain', P.analyzePath);
  const result = received === expected ? '[PASSED]' : '[FAILED]';
  results.push({ resourcePath, action, result });
}

function printResults() {
  log.json('Results', results);
  const total = results.length;
  const passed = results.filter((x) => x.result === '[PASSED]').length;
  const failed = results.filter((x) => x.result === '[FAILED]').length;
  log.info(`Total=${total}, Passed=${passed}, Failed=${failed}`);
  totalCases += total;
  totalPassed += passed;
  totalFailed += failed;
  log.info(`Running Total=${totalCases}, Passed=${totalPassed}, Failed=${totalFailed}`);
}

function testByRole(file, resourcePath, action, expected) {
  results = [];
  const P = newPassportEntity(file);
  testAccess(P, resourcePath, action, expected);
  printResults();
}

function testPassportSuperAdmin() {
  results = [];
  const P = newPassportEntity('passport.superadmin');
  testAccess(P, 'studio/ai-agent', 'UpdateAiAgent', ALLOW);
  testAccess(P, 'studio/ai-agent', 'CreateAiAgent', ALLOW);
  testAccess(P, 'studio/ai-agent', 'CreateUser', ALLOW);
  testAccess(P, 'studio/integration-builder', 'DeployIBRecipe', ALLOW);
  testAccess(P, 'studio/ai-agent', 'UpdateAgentRole', ALLOW);
  testAccess(P, 'studio/ai-agent', 'UpdateUserAgent', ALLOW);
  printResults();
}

function testPassportOrgAdmin() {
  results = [];
  const P = newPassportEntity('passport.orgadmin');
  testAccess(P, 'studio/ai-agent', 'UpdateAiAgent', ALLOW);
  testAccess(P, 'studio/ai-agent', 'CreateAiAgent', ALLOW);
  testAccess(P, 'studio/ai-user', 'CreateUser', ALLOW);
  testAccess(P, 'studio/integration-builder', 'DeployIBRecipe', ALLOW);
  testAccess(P, 'studio/ai-agent', 'UpdateAgentRole', ALLOW);
  testAccess(P, 'studio/ai-agent', 'UpdateUserAgent', ALLOW);
  testAccess(P, 'studio/settings', 'ViewPreferences', ALLOW);
  testAccess(P, 'studio/settings', 'ViewAIAgent', ALLOW);
  testAccess(P, 'studio/ai-user', 'ViewPreferences', ALLOW);
  testAccess(P, 'studio/ai-agent', 'GoldenGun', DENY);
  printResults();
}

function testPassportSupport() {
  results = [];
  const P = newPassportEntity('passport.support');
  testAccess(P, 'studio/ai-agent', 'CreateAiAgent', DENY);
  testAccess(P, 'studio/ai-agent', 'UpdateAiAgent', ALLOW);
  testAccess(P, 'studio/ai-agent', 'CreateUser', DENY);
  testAccess(P, 'studio/ai-agent', 'UpdateAgentRole', ALLOW); // Access to Dropdwon
  testAccess(P, 'studio/ai-agent', 'UpdateUserAgent', ALLOW); // Access to Toggle
  testAccess(P, 'studio/ai-agent', 'UpdateAiAgentUsers', ALLOW); // Access to Menu item "Assign Users"
  testAccess(P, 'studio/integration-builder', 'DeployIBRecipe', ALLOW);
  testAccess(P, 'studio/settings', 'ViewPreferences', ALLOW);
  testAccess(P, 'studio/ai-user', 'ViewPreferences', ALLOW);
  testAccess(P, 'studio/accounts', 'OldBotPage', DENY); // Access to Menu item "Assign Users"
  printResults();
}

function testPassportBotAdmin() {
  results = [];
  const P = newPassportEntity('passport.botadmin');
  testAccess(P, 'studio/ai-agent', 'CreateAiAgent', DENY);
  testAccess(P, 'studio/ai-agent', 'UpdateAiAgent', ALLOW);
  testAccess(P, 'studio/ai-user', 'CreateUser', DENY);
  testAccess(P, 'studio/ai-agent', 'UpdateAgentRole', ALLOW); // Access to Dropdwon
  testAccess(P, 'studio/ai-agent', 'UpdateUserAgent', ALLOW); // Access to Toggle
  testAccess(P, 'studio/ai-agent', 'UpdateAiAgentUsers', ALLOW); // Access to Menu item "Assign Users"
  testAccess(P, 'studio/integration-builder', 'DeployIBRecipe', ALLOW);
  testAccess(P, 'studio/settings', 'ViewPreferences', DENY);
  testAccess(P, 'studio/ai-user', 'ViewPreferences', ALLOW);
  testAccess(P, 'studio/accounts', 'OldBotPage', DENY); // Access to Menu item "Assign Users"
  printResults();
}

function testPassportAnalyst() {
  results = [];
  const P = newPassportEntity('passport.analyst');
  testAccess(P, 'studio/ai-agent', 'CreateAiAgent', DENY);
  testAccess(P, 'studio/ai-agent', 'UpdateAiAgent', ALLOW);
  testAccess(P, 'studio/ai-agent', 'CreateUser', DENY);
  testAccess(P, 'studio/ai-agent', 'UpdateAgentRole', ALLOW);
  testAccess(P, 'studio/ai-agent', 'UpdateUserAgent', ALLOW);
  testAccess(P, 'studio/integration-builder', 'DeployIBRecipe', DENY);
  testAccess(P, 'studio/settings', 'ViewPreferences', DENY);
  testAccess(P, 'studio/ai-user', 'ViewPreferences', ALLOW);
  printResults();
}

function testPassportObserver() {
  results = [];
  const P = newPassportEntity('passport.observer');
  testAccess(P, 'studio/ai-agent', 'UpdateAiAgent', DENY);
  testAccess(P, 'studio/ai-agent', 'CreateAiAgent', DENY);
  testAccess(P, 'studio/ai-agent', 'CreateUser', DENY);
  testAccess(P, 'studio/ai-agent', 'UpdateAgentRole', DENY);
  testAccess(P, 'studio/ai-agent', 'UpdateUserAgent', DENY);
  testAccess(P, 'studio/integration-builder', 'DeployIBRecipe', DENY);
  testAccess(P, 'studio/settings', 'ViewPreferences', DENY);
  testAccess(P, 'studio/ai-user', 'ViewPreferences', ALLOW);
  printResults();
}

function testByRoles(resourcePath, action, expected) {
  testByRole('passport.superadmin', resourcePath, action, expected[0]);
  testByRole('passport.orgadmin', resourcePath, action, expected[1]);
  testByRole('passport.support', resourcePath, action, expected[2]);
  testByRole('passport.botadmin', resourcePath, action, expected[3]);
  testByRole('passport.analyst', resourcePath, action, expected[4]);
  testByRole('passport.observer', resourcePath, action, expected[5]);
}

function main() {
  (async () => {
    // testPassportSuperAdmin();
    // testPassportOrgAdmin();
    testPassportSupport();
    // testPassportBotAdmin(); // 1F
    // testPassportAnalyst();  // 1F
    // testPassportObserver();
    // sequence: SA, OA, Support, AgentAdmin, AgentAnalyst, AgentObserver
    // testByRoles('studio/settings', 'ViewPreferences', [ALLOW, ALLOW, ALLOW, DENY, DENY, DENY]);
    // testByRoles('studio/training', 'DeployAIStage', [ALLOW, ALLOW, ALLOW, ALLOW, DENY, DENY]);
    // testByRoles('studio/training', 'DeployAIProduction', [ALLOW, ALLOW, ALLOW, ALLOW, DENY, DENY]);
  })();
}

main();
