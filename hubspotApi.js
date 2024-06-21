const axios = require("axios");
const async = require("async");
const { setTimeout } = require("timers/promises");
const helpers = require("./helpers.js");

const lctrim = (str) =>
    str === "" || str ? str.toLowerCase().trim() : undefined;

const HEADERS = {
    // @TODO: Verify .env for "Bearer " prefix
    // Authorization: `Bearer ${process.env.HUBSPOT_PRIVATE_KEY}`,
    Authorization: `${process.env.HUBSPOT_PRIVATE_KEY}`,
    "Content-Type": "application/json",
};

const API_URL = "https://api.hubapi.com";

const CONTACTS_PATH = "/crm/v3/objects/contacts";
const APPLICATIONS_PATH = "/crm/v3/objects/2-120350606";

const OPERATION_READ = "read";
const OPERATION_UPDATE = "update";
const OPERATION_CREATE = "create";

const hubspotSetContactToApplicationAssociation = (
    contactId,
    applicationId,
    data
) =>
    axios({
        method: "put",
        url: `${API_URL}/crm/v4/objects/contact/${contactId}/associations/applications/${applicationId}`,
        headers: HEADERS,
        data,
    });

const hubspotRecordBatchOperation = (path, operation) => async (data) =>
    axios({
        method: "post",
        url: `${API_URL}${path}/batch/${operation}`,
        headers: HEADERS,
        data,
    });

const hubspotRecordBatchRead = (path) =>
    hubspotRecordBatchOperation(path, OPERATION_READ);
const hubspotRecordBatchUpdate = (path) =>
    hubspotRecordBatchOperation(path, OPERATION_UPDATE);
const hubspotRecordBatchCreate = (path) =>
    hubspotRecordBatchOperation(path, OPERATION_CREATE);

const hubspotContactsBatchRead = async (data) =>
    hubspotRecordBatchRead(CONTACTS_PATH)(data);
const hubspotContactsBatchUpdate = async (data) =>
    hubspotRecordBatchUpdate(CONTACTS_PATH)(data);
const hubspotContactsBatchCreate = async (data) =>
    hubspotRecordBatchCreate(CONTACTS_PATH)(data);

const hubspotApplicationsBatchRead = async (data) =>
    hubspotRecordBatchRead(APPLICATIONS_PATH)(data);
const hubspotApplicationsBatchUpdate = async (data) =>
    hubspotRecordBatchUpdate(APPLICATIONS_PATH)(data);
const hubspotApplicationsBatchCreate = async (data) =>
    hubspotRecordBatchCreate(APPLICATIONS_PATH)(data);

const updateAndCreateContacts = async (contacts) => {
    let n = 0;

    const listToCreateOrUpdate = helpers.separateList(contacts, 100);

    // for (const list of listToCreateOrUpdate) {
    //    try {
    //      ..
    //    } catch () {}
    // }
    const excludedContactsEmails = [];
    await async.forEachLimit(
        listToCreateOrUpdate,
        1,
        async.asyncify(async (list) => {
            try {
                const getContactIdsResponse = await hubspotContactsBatchRead({
                    properties: ["email", "hs_additional_emails"],
                    idProperty: "email",
                    inputs: list.map((contact) => ({ id: contact.email })),
                });

                const contactIds = [];
                const nonExistingEmails = [];

                const data = getContactIdsResponse.data;

                if (data.status === "COMPLETE") {
                    contactIds.push(
                        ...data.results.map((result) => ({
                            id: result.id,
                            email: result.properties.email,
                            additionalEmail:
                                result.properties.hs_additional_emails
                                    ?.toLowerCase()
                                    .trim(),
                        }))
                    );
                }

                if (data.numErrors > 0) {
                    data.errors[0].context.ids.forEach(function (email) {
                        nonExistingEmails.push(email.toLowerCase().trim());
                    });
                }

                console.log("Existing Contact IDs:", contactIds.length);
                console.log("Non-existing Emails:", nonExistingEmails.length);

                // DONE: bugfix: remove "async", filter is a sync function
                const filteredContacts = list.filter((contact) =>
                    contactIds.find(
                        (existingContact) =>
                            lctrim(existingContact.email) ===
                                lctrim(contact.email) ||
                            lctrim(existingContact.additionalEmail) ===
                                lctrim(contact.email)
                    )
                );

                const excludedContacts = list.filter(
                    (contact) =>
                        !contactIds.find(
                            (existingContact) =>
                                lctrim(existingContact.email) ===
                                    lctrim(contact.email) ||
                                lctrim(existingContact.additionalEmail) ===
                                    lctrim(contact.email)
                        )
                );

                const transformedContacts = {
                    inputs: filteredContacts.map((contact) => ({
                        id: contactIds.find(
                            (existingContact) =>
                                lctrim(existingContact.email) ===
                                    lctrim(contact.email) ||
                                lctrim(existingContact.additionalEmail) ===
                                    lctrim(contact.email)
                        )?.id,
                        properties: {
                            firstname: contact.firstname,
                            student_reference: contact.student_reference,
                            email: contact.email,
                            lastname: contact.lastname,
                            age: contact.age,
                            date_of_birth: contact.date_of_birth,
                            marketing_consent: contact.marketing_consent,
                            phone: contact.phone,
                            mobilephone: contact.mobilephone,
                            zip: contact.zip,
                            school_title: contact.school_title,
                            school_code: contact.school_code,
                            marketing_contact_methods:
                                contact.marketing_contact_methods,
                        },
                    })),
                };

                const updateResponse = await hubspotContactsBatchUpdate({
                    inputs: transformedContacts.inputs
                        .filter((x) => x.id !== undefined)
                        .map((contact) => ({
                            id: contact.id,
                            properties: contact.properties,
                        })),
                });

                // Check if there are errors in the response
                if (updateResponse.data.numErrors > 0) {
                    // Log errors
                    console.log(updateResponse.data.errors[0]);
                }

                const contactsToCreate = {
                    inputs: list
                        .filter((contact) =>
                            nonExistingEmails.includes(contact.email)
                        )
                        .map((contact) => ({
                            properties: {
                                firstname: contact.firstname,
                                student_reference: contact.student_reference,
                                email: contact.email,
                                lastname: contact.lastname,
                                age: contact.age,
                                date_of_birth: contact.date_of_birth,
                                marketing_consent: contact.marketing_consent,
                                phone: contact.phone,
                                mobilephone: contact.mobilephone,
                                zip: contact.zip,
                                school_title: contact.school_title,
                                school_code: contact.school_code,
                                marketing_contact_methods:
                                    contact.marketing_contact_methods,
                            },
                        })),
                };

                const createResponse = await hubspotContactsBatchCreate(
                    contactsToCreate
                );

                console.log(
                    `Existing contacts: ${contactIds.length}/${list.length}`
                );

                console.log(
                    `Excluded contacts: ${excludedContacts.length} of ${list.length} existing`
                );

                console.log(
                    `Updating properties of: ${updateResponse.data.results.length} /${transformedContacts.inputs.length}`
                );
                console.log(
                    `Created non-existing contacts: ${
                        createResponse.data?.results?.length || 0
                    } /${nonExistingEmails.length}`
                );

                for (const pContact of excludedContacts) {
                    console.log(`[excluded] ${pContact.email} `);
                    excludedContactsEmails.push(pContact.email);
                }

                /*
        console.log(
          `Updating properties of: ${updateResponse.data.results.length}/${transformedContacts.inputs.length}`
        );
        console.log(
          `Created non-existing contacts: ${createResponse.data?.results?.length || 0}/${nonExistingEmails.length}`
        );
*/
                n += list.length;
                console.log(
                    `%d/%d contact(s) has been processed`,
                    n,
                    contacts.length
                );
                console.log("################################");

                if (list.length === 100) {
                    await setTimeout(5 * 1000);
                }
            } catch (e) {
                console.log(e);
            }
        })
    );
    console.log(
        "All excluded emails: ",
        JSON.stringify(excludedContactsEmails, null, 2)
    );
};

const updateAndCreateApplications = async (contacts) => {
    // Initialize an empty array to store unitids
    let applications = [];

    // Iterate through each contact
    for (let contact of contacts) {
        // Check if the contact has an 'applications' array
        if (contact.applications && Array.isArray(contact.applications)) {
            // Iterate through each application in the contact
            for (let application of contact.applications) {
                // Check if the application has a 'unitid' property
                if (application.unitid) {
                    // Add the 'unitid' to the 'unitids' array
                    applications.push({
                        unitid: application.unitid,
                        student_reference: application.student_reference,
                        student_first_name: application.student_first_name,
                        student_last_name: application.student_last_name,
                        student_age: application.student_age,
                        email: application.email,
                        course_occurrence: application.course_occurrence,
                        course_code: application.course_code,
                        website_advertised_title:
                            application.website_advertised_title,
                        college_code: application.college_code,
                        college_name: application.college_name,
                        org_level_1_code: application.org_level_1_code,
                        org_level_1_name: application.org_level_1_name,
                        org_level_2_code: application.org_level_2_code,
                        org_level_2_name: application.org_level_2_name,
                        org_level_3_code: application.org_level_3_code,
                        org_level_3_name: application.org_level_3_name,
                        application_created_date:
                            application.application_created_date,
                        study_location_code:
                            application.study_location_code || undefined,
                        postal_code: application.postal_code || undefined,
                        study_location_description:
                            application.study_location_description || undefined,
                        study_location_postcode:
                            application.study_location_postcode || undefined,
                        qualification_type:
                            application.qualification_type || undefined,
                        stage: application.stage,
                        marketing_contact_methods:
                            application.marketing_contact_methods || undefined,
                        marketing_consent:
                            application.marketing_consent || undefined,
                    });
                }
            }
        }
    }

    let n = 0;

    console.log(
        `DEB total applications: ${applications.length} for ${contacts.length} contacts`
    );
    const listToCreateOrUpdate = helpers.separateList(applications, 100);
    let batchIndex = 0;
    await async.forEachLimit(
        listToCreateOrUpdate,
        1,
        async.asyncify(async (list) => {
            try {
                console.log(
                    `DEB: batch[${batchIndex}], list.length =  "${list.length}", listToCreateOrUpdate="${listToCreateOrUpdate.length} "`
                );
                //        console.log(`DEB: batch[${batchIndex}], list =  "${list.length}" "`, JSON.stringify(list, null, 2));

                batchIndex++;
                // Get applications id from unitid
                const getApplicationIdsResponse =
                    await hubspotApplicationsBatchRead({
                        idProperty: "unitid",
                        inputs: list.map((app) => ({ id: app.unitid })),
                    });

                const applicationsIds = [];
                const nonExistingApplications = [];

                const updateApplications = [];
                const createApplications = [];

                const data = getApplicationIdsResponse.data;
                //	console.log(`DEV batch[batchIndex] data = `, JSON.stringify(data, null, 2))
                if (data.status === "COMPLETE") {
                    if (data.results.length > 0) {
                        // Extract data to update
                        applicationsIds.push(
                            ...data.results.map((result) => ({
                                id: result.id,
                                unitid: result.properties.unitid,
                            }))
                        );

                        const filteredApplications = list.filter((app) =>
                            applicationsIds.some(
                                // DONE: change "==" => "==="
                                (existingApplication) =>
                                    String(existingApplication.unitid) ===
                                    String(app.unitid)
                            )
                        );

                        updateApplications.push(
                            ...filteredApplications.map((app) => ({
                                id: applicationsIds.find(
                                    // DONE: change "==" => "==="
                                    (existingApplication) =>
                                        String(existingApplication.unitid) ===
                                        String(app.unitid)
                                )?.id,
                                properties: {
                                    firstname: app.firstname,
                                    student_reference: app.student_reference,
                                    email: app.email,
                                    lastname: app.lastname,
                                    date_of_birth: app.date_of_birth,
                                    student_age: app.student_age,
                                    marketing_consent: app.marketing_consent,
                                    phone: app.phone,
                                    mobilephone: app.mobilephone,
                                    zip: app.zip,
                                    school_title: app.school_title,
                                    school_code: app.school_code,
                                    stage: app.stage,
                                    study_location_postcode:
                                        app.study_location_postcode,
                                    postal_code: app.postal_code,
                                    marketing_contact_methods:
                                        app.marketing_contact_methods,
                                    marketing_consent: app.marketing_consent,
                                    hs_pipeline_stage:
                                        helpers.stageToInternalId(app.stage),
                                },
                            }))
                        );
                    }

                    if (data.numErrors > 0) {
                        // Extract data to create
                        data.errors.forEach((error) => {
                            if (error.category === "OBJECT_NOT_FOUND") {
                                error.context.ids.forEach((id) => {
                                    // Find the application in the list array based on unitid
                                    // DONE: changed "==" => "==="
                                    const applicationFromList = list.find(
                                        (app) =>
                                            String(app.unitid) === String(id)
                                    );

                                    console.log(applicationFromList);

                                    if (applicationFromList) {
                                        createApplications.push({
                                            properties: {
                                                ...applicationFromList,
                                                hs_pipeline_stage:
                                                    helpers.stageToInternalId(
                                                        applicationFromList.stage
                                                    ),
                                            },
                                        });
                                    }
                                });
                            }
                        });
                    }
                }

                if (updateApplications.length > 0) {
                    const transformedApplications = {
                        inputs: updateApplications.map((app) => ({
                            id: app.id,
                            properties: app.properties,
                        })),
                    };

                    const updateApplicationResponse =
                        await hubspotApplicationsBatchUpdate(
                            transformedApplications
                        );

                    console.log(
                        "%d/%d updated",
                        updateApplicationResponse.data.results.length,
                        list.length
                    );
                }

                // Perform the create logic
                if (createApplications.length > 0) {
                    const applicationsToCreate = {
                        inputs: createApplications,
                    };

                    const createApplicationResponse =
                        await hubspotApplicationsBatchCreate(
                            applicationsToCreate
                        );

                    console.log(
                        "%d/%d created",
                        createApplicationResponse.data.results.length,
                        list.length
                    );
                }
            } catch (e) {
                console.log(e);
            }
        })
    );
};

const updateAndCreateAssociations = async (contacts) => {
    // Initialize an empty array to store unitids
    let applications = [];

    // Iterate through each contact
    for (let contact of contacts) {
        // Check if the contact has an 'applications' array
        if (contact.applications && Array.isArray(contact.applications)) {
            // Iterate through each application in the contact
            for (let application of contact.applications) {
                // Check if the application has a 'unitid' property
                if (application.unitid) {
                    // Add the 'unitid' to the 'unitids' array
                    applications.push({
                        unitid: application.unitid,
                        student_reference: application.student_reference,
                        student_first_name: application.student_first_name,
                        student_last_name: application.student_last_name,
                        email: application.email,
                        course_occurrence: application.course_occurrence,
                        course_code: application.course_code,
                        website_advertised_title:
                            application.website_advertised_title,
                        college_code: application.college_code,
                        college_name: application.college_name,
                        org_level_1_code: application.org_level_1_code,
                        org_level_1_name: application.org_level_1_name,
                        org_level_2_code: application.org_level_2_code,
                        org_level_2_name: application.org_level_2_name,
                        org_level_3_code: application.org_level_3_code,
                        org_level_3_name: application.org_level_3_name,
                        application_created_date:
                            application.application_created_date,
                        study_location_code:
                            application.study_location_code || undefined,
                        study_location_description:
                            application.study_location_description || undefined,
                        study_location_postcode:
                            application.study_location_postcode || undefined,
                        qualification_type:
                            application.qualification_type || undefined,
                        stage: application.stage,
                    });
                }
            }
        }
    }

    console.log("applications", applications.length);

    const listOfContacts = helpers.separateList(applications, 100);

    await async.forEachLimit(
        listOfContacts,
        1,
        async.asyncify(async (list) => {
            try {
                // Get all contacts id
                const getContactIdsResponse = await hubspotContactsBatchRead({
                    properties: ["email", "hs_additional_emails"],
                    idProperty: "email",
                    inputs: list.map((contact) => ({ id: contact.email })),
                });

                // Get applications id from unitid
                const getApplicationIdsResponse =
                    await hubspotApplicationsBatchRead({
                        idProperty: "unitid",
                        inputs: list.map((app) => ({ id: app.unitid })),
                        properties: ["email"],
                    });

                let contactsWithId = [];
                let applicationsIds = [];

                if (getContactIdsResponse.data.status === "COMPLETE") {
                    contactsWithId.push(
                        ...getContactIdsResponse.data.results.map((result) => ({
                            id: result.id,
                            email: result.properties.email,
                            additionalEmail: lctrim(
                                result.properties.hs_additional_emails
                            ),
                        }))
                    );
                }

                if (getApplicationIdsResponse.data.status === "COMPLETE") {
                    applicationsIds.push(
                        ...getApplicationIdsResponse.data.results.map(
                            (result) => ({
                                id: result.id,
                                unitid: result.properties.unitid,
                                email: lctrim(result.properties.email),
                            })
                        )
                    );
                }

                // DEBUG THIS PART
                // TO VERIFY START START START
                const updatedList = list.map((application) => {
                    const applicationEmailLowerCaseTrim = lctrim(
                        application.email
                    );
                    // Find the corresponding contact object using the email property

                    // contact === {{{ <email || additionalEmail >== application.email }}
                    // contact
                    const contactWithId = contactsWithId.find(
                        (c) =>
                            lctrim(c.email) === applicationEmailLowerCaseTrim ||
                            lctrim(c.additionalEmail) ===
                                applicationEmailLowerCaseTrim
                    );
                    const contactId = contactWithId?.id;
                    const applicationWithId = applicationsIds.find(
                        // DONE: changed "==" => "==="
                        (app) =>
                            String(app.unitid) === String(application.unitid)
                    );

                    // Create a new object with the existing properties and add contactId and applicationId
                    return {
                        ...application,
                        contactId,
                        applicationId: applicationWithId
                            ? applicationWithId.id
                            : undefined,
                    };
                });

                console.log("updatedList", updatedList.length);

                let b = 0;
                // Check if the association exists otherwise create it
                for (const app of updatedList) {
                    const association =
                        await hubspotSetContactToApplicationAssociation(
                            app.contactId,
                            app.applicationId,
                            JSON.stringify([
                                {
                                    associationCategory: "USER_DEFINED",
                                    associationTypeId: 54,
                                },
                            ])
                        );

                    b += 1;
                    if (association.statusText !== "Created") {
                        console.log(association);
                    }
                    console.log("%d/%d", b, updatedList.length);
                    await setTimeout(10 * 1001);
                }
            } catch (e) {
                console.log(e);
            }
        })
    );
};

module.exports = {
    updateAndCreateContacts,
    updateAndCreateApplications,
    updateAndCreateAssociations,
};
