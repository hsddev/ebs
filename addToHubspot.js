// Dependencies
const async = require("async");
const util = require("util");
const axios = require("axios");
const helpers = require("./helpers.js");

// Add contacts to hubspot function
const addContactsToHubspot = async (contacts) => {
    // Contacts count
    let n = 0;

    // List of group by 1000
    const listToCreateOrUpdate = helpers.separateList(contacts, 1000);

    // Iterate every list to create or add
    await async.forEachLimit(
        listToCreateOrUpdate,
        1,
        async.asyncify(async (list) => {
            try {
                const response = await axios({
                    method: "post",
                    url: "https://api.hubapi.com/contacts/v1/contact/batch",
                    headers: {
                        Authorization:
                            "Bearer pat-eu1-28ce7e46-5c39-45b2-b93a-405138c9c9fc",
                        "Content-Type": "application/json",
                    },
                    data: list.map((contact) => {
                        return {
                            email: contact.email,
                            properties: [
                                ...Object.entries(contact)
                                    .map(([property, value]) => ({
                                        property,
                                        value,
                                    }))
                                    .filter(
                                        (x) => typeof x.value !== "undefined"
                                    ),
                            ],
                        };
                    }),
                });

                n += list.length;
                console.log(
                    "%d/%d contact(s) has been processed",
                    n,
                    contacts.length
                );

                if (list.length === 1000)
                    await util.promisify(setTimeout)(5 * 1000);
            } catch (e) {
                console.log(e);
            }
        })
    );

    console.log("Hubspot function has been finished!");
};

module.exports = addContactsToHubspot;
