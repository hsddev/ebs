// Dependencies
const sql = require("mssql");
const helpers = require("./helpers");

// Database configuration
const pool = new sql.ConnectionPool({
    user: process.env.DB_USER,
    password: process.env.DB_USER_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
});

const getEbsData = async () => {
    try {
        // Connect to database
        const connect = await pool.connect();

        // Get data from contacts table
        const contacts = await connect
          .request()
          .query("SELECT * FROM Contacts");

        // DONE: bugfix: changed pool => connect
        // Get data from applications table
        const applications = await connect
          .request()
          .query("SELECT * FROM Applications");

        // DONE: small fix: removed await
        // Create a mapping of contacts by email
        let contactsByEmail = contacts.recordset.reduce((map, contact) => {
            map[contact.PERSONAL_EMAIL] = {
                firstname: contact.FIRST_NAME,
                student_reference: contact.STUDENT_REFERENCE,
                email: contact.PERSONAL_EMAIL.toLowerCase().trim(),
                lastname: contact.LAST_NAME,
                date_of_birth: contact.DATE_OF_BIRTH,
                marketing_consent: contact.MARKETING_CONSENT || undefined,
                phone: contact.PHONE_NUMBER || undefined,
                mobilephone: contact.MOBILE_PHONE_NUMBER || undefined,
                zip: contact.POSTAL_CODE || undefined,
                school_title: contact.SCHOOL_DESCRIPTION || undefined,
                school_code: contact.SCHOOL_CODE,
                marketing_contact_methods:
                    contact.MARKETING_CONTACT_METHODS || undefined,
                age: helpers.getAge(contact.DATE_OF_BIRTH) || undefined,
                applications: [],
            };
            return map;
        },
        {}
      );

        // DONE: small fix: removed await
        // Associate applications with contacts by email
        applications.recordset.forEach((application) => {
            const email = application.PERSONAL_EMAIL;

            if (contactsByEmail[email]) {
                const contact = contactsByEmail[email];
                // Update the contact's applications array
                contactsByEmail[email].applications.push({
                    student_reference: contact.student_reference,
                    student_first_name: contact.firstname,
                    student_last_name: contact.lastname,
                    student_age: contact.age,
                    email: contact.email.toLowerCase().trim(),
                    unitid: application.UNIT_ID,
                    course_occurrence: application.COURSE_OCCURRENCE,
                    course_code: application.COURSE_CODE,
                    website_advertised_title: application.WEBTITLE,
                    college_code: application.COLLEGE_CODE,
                    college_name: application.COLLEGE_FULLNAME,
                    org_level_1_code: application.ORG_L1_CODE,
                    org_level_1_name: application.ORG_L1_FULLNAME,
                    org_level_2_code: application.ORG_L2_CODE,
                    org_level_2_name: application.ORG_L2_FULLNAME,
                    org_level_3_code: application.ORG_L3_CODE,
                    org_level_3_name: application.ORG_L3_FULLNAME,
                    application_created_date:
                      application.APPLICATION_CREATED_DATE,
                    study_location_code:
                      application.STUDY_LOCATION_CODE || undefined,
                    study_location_description:
                      application.STUDY_LOCATION_DESCRIPTION || undefined,
                    study_location_postcode: application.STUDY_LOCATION_POSTCODE || undefined,
                    postal_code: contact.zip || undefined,
                    qualification_type:
                      application.QUALIFICATION_TYPE || undefined,
                    stage: application.STAGE.toLowerCase().trim(),
                });
            }
        });

        // Convert the map to an array
        const changedUsers = Object.values(contactsByEmail);

        return changedUsers;
    } catch (err) {
        console.log(err);
    }
};

// getEbsData().then((x) => console.log(x[0]));
module.exports = getEbsData;
