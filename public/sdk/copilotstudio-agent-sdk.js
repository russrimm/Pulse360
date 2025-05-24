/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import * as msal from '@azure/msal-node';
import { ActivityTypes } from '@microsoft/agents-activity';
import { loadCopilotStudioConnectionSettingsFromEnv, CopilotStudioClient } from '@microsoft/agents-copilotstudio-client';
import pkg from '@microsoft/agents-copilotstudio-client/package.json' with { type: 'json' };
import readline from 'readline';
import open from 'open';
import os from 'os';
import path from 'path';
import { MsalCachePlugin } from './msalCachePlugin.js';
async function acquireToken(settings) {
    const msalConfig = {
        auth: {
            clientId: settings.appClientId,
            authority: `https://login.microsoftonline.com/${settings.tenantId}`,
        },
        cache: {
            cachePlugin: new MsalCachePlugin(path.join(os.tmpdir(), 'mcssample.tockencache.json'))
        },
        system: {
            loggerOptions: {
                loggerCallback(loglevel, message, containsPii) {
                    if (!containsPii) {
                        console.log(loglevel, message);
                    }
                },
                piiLoggingEnabled: false,
                logLevel: msal.LogLevel.Verbose,
            }
        }
    };
    const pca = new msal.PublicClientApplication(msalConfig);
    const tokenRequest = {
        scopes: ['https://api.powerplatform.com/.default'],
        redirectUri: 'http://localhost',
        openBrowser: async (url) => {
            await open(url);
        }
    };
    let token;
    try {
        const accounts = await pca.getAllAccounts();
        if (accounts.length > 0) {
            const response2 = await pca.acquireTokenSilent({ account: accounts[0], scopes: tokenRequest.scopes });
            token = response2.accessToken;
        }
        else {
            const response = await pca.acquireTokenInteractive(tokenRequest);
            token = response.accessToken;
        }
    }
    catch (error) {
        console.error('Error acquiring token interactively:', error);
        const response = await pca.acquireTokenInteractive(tokenRequest);
        token = response.accessToken;
    }
    return token;
}
const createClient = async () => {
    const settings = loadCopilotStudioConnectionSettingsFromEnv();
    const token = await acquireToken(settings);
    const copilotClient = new CopilotStudioClient(settings, token);
    console.log(`Copilot Studio Client Version: ${pkg.version}, running with settings: ${JSON.stringify(settings, null, 2)}`);
    return copilotClient;
};
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
const askQuestion = async (copilotClient, conversationId) => {
    rl.question('\n>>>: ', async (answer) => {
        if (answer.toLowerCase() === 'exit') {
            rl.close();
        }
        else {
            const replies = await copilotClient.askQuestionAsync(answer, conversationId);
            replies.forEach((act) => {
                var _a;
                if (act.type === ActivityTypes.Message) {
                    console.log(`\n${act.text}`);
                    (_a = act.suggestedActions) === null || _a === void 0 ? void 0 : _a.actions.forEach((action) => console.log(action.value));
                }
                else if (act.type === ActivityTypes.EndOfConversation) {
                    console.log(`\n${act.text}`);
                    rl.close();
                }
            });
            await askQuestion(copilotClient, conversationId);
        }
    });
};
const main = async () => {
    var _a, _b;
    const copilotClient = await createClient();
    const act = await copilotClient.startConversationAsync(true);
    console.log('\nSuggested Actions: ');
    (_a = act.suggestedActions) === null || _a === void 0 ? void 0 : _a.actions.forEach((action) => console.log(action.value));
    await askQuestion(copilotClient, (_b = act.conversation) === null || _b === void 0 ? void 0 : _b.id);
};
main().catch(e => console.log(e));
//# sourceMappingURL=index.js.map