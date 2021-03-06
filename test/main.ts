declare var require: (s: string) => any;
import * as chai from "chai";
import "mocha";
import { Util } from "@pnp/common";
import { Web, sp } from "@pnp/sp";
import { graph } from "@pnp/graph";
import { SPFetchClient, AdalFetchClient } from "@pnp/nodejs";
import * as chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);

export interface ISettingsTestingPart {
    enableWebTests: boolean;
    graph?: {
        id: string;
        secret: string;
        tenant: string;
    };
    sp?: {
        webUrl?: string;
        id: string;
        notificationUrl: string | null;
        secret: string;
        url: string;
    };
}

export interface ISettings {
    testing: ISettingsTestingPart;
}

// we need to load up the appropriate settings based on where we are running
let settings: ISettings = null;
let mode = "cmd";
process.argv.forEach(s => {
    if (/^--pnp-test-mode/.test(s)) {
        mode = s.split("=")[1];
    }
});



switch (mode) {

    case "travis":

        const webTests = process.env.PnPTesting_ClientId && process.env.PnPTesting_ClientSecret && process.env.PnPTesting_SiteUrl;

        settings = {
            testing: {
                enableWebTests: Boolean.parse(webTests).valueOf(),
                graph: {
                    id: "",
                    secret: "",
                    tenant: "",
                },
                sp: {
                    id: process.env.PnPTesting_ClientId,
                    notificationUrl: process.env.PnPTesting_NotificationUrl || null,
                    secret: process.env.PnPTesting_ClientSecret,
                    url: process.env.PnPTesting_SiteUrl,
                },
            },
        };

        break;
    case "travis-noweb":

        settings = {
            testing: {
                enableWebTests: false,
            },
        };

        break;
    default:

        settings = require("../../settings");

        break;
}

function spTestSetup(ts: ISettingsTestingPart): Promise<void> {

    return new Promise((resolve, reject) => {

        sp.setup({
            sp: {
                fetchClientFactory: () => {
                    return new SPFetchClient(ts.sp.url, ts.sp.id, ts.sp.secret);
                },
            },
        });

        // create the web in which we will test
        const d = new Date();
        const g = Util.getGUID();

        sp.web.webs.add(`PnP-JS-Core Testing ${d.toDateString()}`, g).then(() => {

            const url = Util.combinePaths(ts.sp.url, g);

            // set the testing web url so our tests have access if needed
            ts.sp.webUrl = url;

            // re-setup the node client to use the new web
            sp.setup({

                sp: {
                    // headers: {
                    //     "Accept": "application/json;odata=verbose",
                    // },
                    fetchClientFactory: () => {
                        return new SPFetchClient(url, ts.sp.id, ts.sp.secret);
                    },
                },
            });

            resolve();

        }).catch(reject);
    });
}

function graphTestSetup(ts: ISettingsTestingPart): Promise<void> {

    return new Promise((resolve, reject) => {

        graph.setup({
            graph: {
                fetchClientFactory: () => {
                    return new AdalFetchClient(ts.graph.tenant, ts.graph.id, ts.graph.secret);
                },
            },
        });

        resolve();
    });
}

export let testSettings: ISettingsTestingPart = Util.extend(settings.testing, { webUrl: "" });

before(function (done: MochaDone) {

    // this may take some time, don't timeout early
    this.timeout(90000);

    // establish the connection to sharepoint
    if (testSettings.enableWebTests) {

        Promise.all([
            // un comment this to delete older subsites
            // cleanUpAllSubsites(),
            spTestSetup(testSettings),
            graphTestSetup(testSettings),
        ]).then(_ => done()).catch(e => {

            console.log("Error creating testing sub-site: " + JSON.stringify(e));
            done(e);
        });
    }
});

after(() => {

    // could remove the sub web here?
    // clean up other stuff?
    // write some logging?
});

// this can be used to clean up lots of test sub webs :)
function cleanUpAllSubsites(): Promise<void> {
    return sp.site.rootWeb.webs.select("Title").get().then((w) => {
        w.forEach((element: any) => {
            const web = new Web(element["odata.id"], "");
            web.webs.select("Title").get().then((sw: any[]) => {
                return Promise.all(sw.map((value) => {
                    const web2 = new Web(value["odata.id"], "");
                    return web2.delete();
                }));
            }).then(() => { web.delete(); });
        });
    });
}
