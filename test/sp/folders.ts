import { expect } from "chai";
import { testSettings } from "../main";
import "@pnp/sp/src/folders";
import "@pnp/sp/src/webs";
import "@pnp/sp/src/sharing";
import "@pnp/sp/src/site-users/web";
import "@pnp/sp/src/files";
import { IInvokableTest } from "../types";
import { Web } from "@pnp/sp/src/webs";
import { getRandomString } from "@pnp/common";
import { SharingLinkKind } from "@pnp/sp/src/sharing";

describe("Folders", () => {
    if (testSettings.enableWebTests) {
        const web = Web(testSettings.sp.url);

        it("adds new folder", function () {
            const name = `test_${getRandomString(4)}`;
            return expect(web.folders.add(name)).to.eventually.be.fulfilled;
        });

        it("gets folder by name", function () {
            return expect(web.folders.getByName("SitePages")()).to.eventually.be.fulfilled;
        });
    }
});

describe("Folder", () => {
    if (testSettings.enableWebTests) {
        const web = Web(testSettings.sp.url);

        describe("Invokable Properties", () => {

            const tests: IInvokableTest[] = [
                { desc: ".rootFolder:web", test: web.rootFolder },
                { desc: ".folders:web", test: web.folders },
                { desc: ".rootFolder:list", test: web.lists.getByTitle("Site Pages").rootFolder },
                { desc: ".folders:list", test: web.lists.getByTitle("Site Pages").rootFolder.folders },
                { desc: ".folder:item", test: web.lists.getByTitle("Site Pages").items.getById(1).folder },
            ];

            tests.forEach((testObj) => {
                const { test, desc } = testObj;
                it(desc, () => expect((<any>test)()).to.eventually.be.fulfilled);
            });
        });

        it("gets folder item", async function () {
            await web.rootFolder.folders.getByName("SiteAssets").folders.add("test");
            return expect(web.rootFolder.folders.getByName("SiteAssets").folders.getByName("test").getItem()).to.eventually.be.fulfilled;
        });

        it("moves folder to a new destination", async function () {
            const folderName = `test2_${getRandomString(5)}`;
            await web.rootFolder.folders.getByName("SiteAssets").folders.add(folderName);
            const { ServerRelativeUrl: srcUrl } = await web.select("ServerRelativeUrl")<{ ServerRelativeUrl: string }>();
            const moveToUrl = `${srcUrl}/SiteAssets/moved_${getRandomString(5)}`;
            return expect(web.rootFolder.folders.getByName("SiteAssets").folders.getByName(folderName).moveTo(moveToUrl)).to.eventually.be.fulfilled;
        });

        it("recycles folder", async function () {
            await web.rootFolder.folders.getByName("SiteAssets").folders.add("test3");
            return expect(web.rootFolder.folders.getByName("SiteAssets").folders.getByName("test").recycle()).to.eventually.be.fulfilled;
        });

        it("should get server relative url", function () {
            return expect(web.rootFolder.folders.getByName("SiteAssets").serverRelativeUrl()).to.eventually.be.fulfilled;
        });

        it("should update folder's properties", function () {
            return expect(web.rootFolder.folders.getByName("SiteAssets").update({
                "Name": "SiteAssets",
            })).to.eventually.be.fulfilled;
        });

        it("should get content type order", function () {
            return expect(web.rootFolder.folders.getByName("SiteAssets").contentTypeOrder()).to.eventually.be.fulfilled;
        });

        it("should get folders", function () {
            return expect(web.rootFolder.folders.getByName("SiteAssets").folders()).to.eventually.be.fulfilled;
        });

        it("should get files", function () {
            return expect(web.rootFolder.folders.getByName("SiteAssets").files()).to.eventually.be.fulfilled;
        });

        it("should get listItemAllFields", async function () {
            await web.rootFolder.folders.getByName("SiteAssets").folders.add("test4");
            return expect(web.rootFolder.folders.getByName("SiteAssets").folders.getByName("test4").listItemAllFields()).to.eventually.be.fulfilled;
        });

        it("should get parentFolder", async function () {
            return expect(web.rootFolder.folders.getByName("SiteAssets").parentFolder()).to.eventually.be.fulfilled;
        });

        it("should get properties", async function () {
            return expect(web.rootFolder.folders.getByName("SiteAssets").properties.get()).to.eventually.be.fulfilled;
        });

        it("should get uniqueContentTypeOrder", async function () {
            return expect(web.rootFolder.folders.getByName("SiteAssets").uniqueContentTypeOrder()).to.eventually.be.fulfilled;
        });

        it("should get sharing information", async function () {
            await web.rootFolder.folders.getByName("SiteAssets").folders.add("test4");
            return expect(web.rootFolder.folders.getByName("SiteAssets").folders.getByName("test4").getSharingInformation()).to.eventually.be.fulfilled;
        });

        it("should get object sharing settings", async function () {
            await web.rootFolder.folders.getByName("SiteAssets").folders.add("test4");
            return expect(web.rootFolder.folders.getByName("SiteAssets").folders.getByName("test4").getObjectSharingSettings()).to.eventually.be.fulfilled;
        });

        it("should unshare folder", async function () {
            await web.rootFolder.folders.getByName("SiteAssets").folders.add("test4");
            return expect(web.rootFolder.folders.getByName("SiteAssets").folders.getByName("test4").unshare()).to.eventually.be.fulfilled;
        });

        it("should share link", async function () {
            await web.rootFolder.folders.getByName("SiteAssets").folders.add("test4");
            return expect(web.rootFolder.folders.getByName("SiteAssets").folders.getByName("test4").getShareLink(SharingLinkKind.OrganizationView)).to.eventually.be.fulfilled;
        });

        it("should check sharing permissions", async function () {
            await web.rootFolder.folders.getByName("SiteAssets").folders.add("test4");
            return expect(web.rootFolder.folders.getByName("SiteAssets").folders.getByName("test4").checkSharingPermissions([{
                alias: "everyone except external users",
            }])).to.eventually.be.fulfilled;
        });

        it("should delete sharing link", async function () {
            await web.rootFolder.folders.getByName("SiteAssets").folders.add("test4");
            return expect(web.rootFolder.folders.getByName("SiteAssets").folders.getByName("test4")
                .deleteSharingLinkByKind(SharingLinkKind.OrganizationView)).to.eventually.be.fulfilled;
        });

        it("should unshare link", async function () {
            await web.rootFolder.folders.getByName("SiteAssets").folders.add("test4");
            return expect(web.rootFolder.folders.getByName("SiteAssets").folders.getByName("test4").unshareLink(SharingLinkKind.OrganizationView)).to.eventually.be.fulfilled;
        });

        it("should share with login name", async function () {
            const user = await web.ensureUser("everyone except external users");
            const login = user.data.LoginName;
            return expect(web.rootFolder.folders.getByName("SiteAssets").folders.getByName("test4").shareWith(login)).to.eventually.be.fulfilled;
        });
    }
});