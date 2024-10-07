document.addEventListener('DOMContentLoaded', function() {

    // By default, load the inbox
    console.log("Go to INBOX");
    load_mailbox('inbox');

    // Use buttons to toggle between views
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', () => compose_email());
    // press Submit button
    document.querySelector('#send').addEventListener('click', send_email);

});


function reply_email(id){
    // Prevent the default form submission
    event.preventDefault();
    console.log("Reply email id: ", id);

    fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {
    // Print email
    console.log(email);

    recipients = email.sender;

    if (email.subject.split(" ")[0] !== "Re:") {
        subject = `Re: ${email.subject}`;
    } else {
        subject = email.subject;
    }

    body = `On ${email.timestamp} ${email.sender} wrote:\n${email.body}`

    compose_email(recipients, subject, body);

     });

}

function archive_email(id, button_name) {
    console.log(`${button_name} email id: `, id)

    // set action to true if button_name is "Archive", and false otherwise.
    action = (button_name === "Archive");

    fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: action
        })
    })
    // Go to Inbox
    .then(() => load_mailbox('inbox'));
}

function read_email(id) {
    console.log("Read email id: ", id);

    // Show compose view and hide other views
    document.querySelector('#email-view').style.display = 'block';
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';

    // open email view and make it 'read'
    fetch(`/emails/${id}`)
        .then(response => response.json())
        .then(email => {
            console.log(email);
            document.querySelector('#date').innerHTML = email.timestamp;
            document.querySelector('#from-email').value = email.sender;
            document.querySelector('#from-email').disabled = true;
            document.querySelector('#to-email').value = email.recipients;
            document.querySelector('#to-email').disabled = true;
            document.querySelector('#email-subject').value = email.subject;
            document.querySelector('#email-subject').disabled = true;
            document.querySelector('#body-email').innerHTML = email.body;
            document.querySelector('#body-email').disabled = true;

            return fetch(`/emails/${id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    read: true
                })
            });
        });

    // press Reply button listerner
    document.querySelector('#reply').addEventListener('click', () => reply_email(id));

}


function send_email() {
    // Prevent the default form submission
    event.preventDefault();
    console.log('Submit button clicked');

    fetch('/emails', {
            method: 'POST',
            body: JSON.stringify({
                recipients: document.querySelector('#compose-recipients').value,
                subject: document.querySelector('#compose-subject').value,
                body: document.querySelector('#compose-body').value
            })
        })

        .then(response => {
            console.log('Response received');
            return response.json();
        })

        .then(result => {
            // result
            console.log('Result processed:', result);

            if (!result.error) {
                alert(result.message);
                // redirect to Sent
                console.log(result.message);
                console.log("Go to SENT");
                load_mailbox('sent');
            } else {
                alert(result.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}


function compose_email(recipients='', subject='', body='') {

    // Show compose view and hide other views
    document.querySelector('#email-view').style.display = 'none';
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

    // Clear out composition fields
    document.querySelector('#compose-recipients').value = recipients;
    document.querySelector('#compose-subject').value = subject;
    document.querySelector('#compose-body').value = body;

}

function load_mailbox(mailbox) {
    // Show the mailbox and hide other views
    document.querySelector('#email-view').style.display = 'none';
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';

    // Show the mailbox name
    console.log("Box name", mailbox)
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

    fetch(`/emails/${mailbox}`)
        .then(response => response.json())
        .then(emails => {
            // Print emails
            console.log(emails);

            // sort descending by time
            emails.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            // Append table to the container
            const tableContainer = document.getElementById('emails-view');
            const table = createTable(emails, mailbox);
            tableContainer.appendChild(table);
        });
}


// Function to create table
function createTable(data, box) {

    // From or To to show in the table by default (for Inbox and Archived boxes)
    email_to_show = "sender";
    email_to_show_header = "From";

    // for Sent box To will be shown as an email, no Achive button
    if (box === "sent") {
        email_to_show = "recipients";
        email_to_show_header = "To";
    }

    if (box === "inbox") {
        button_name = "Archive";
    } else {
        button_name = "Unarchive";
    }

    // console.log(email_to_show)

    // Create a table element
    const table = document.createElement('table');
    table.classList.add('table');

    // Create table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = [email_to_show_header, "Subject", "Date", ""];
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create table rows
    const tbody = document.createElement('tbody');

    if (box !== "sent") {
        data.forEach(item => {
            const row = document.createElement('tr');
            const btn = document.createElement('button');
            btn.id = "archive";
            btn.innerHTML = button_name;
            btn.style.marginTop = "5px";
            btn.style.marginBottom = "5px";
            document.body.appendChild(btn);
            btn.classList.add("btn", "btn-light");

            // what to do on click
            row.addEventListener('click', () => read_email(item.id));
            btn.addEventListener('click', (event) => {
                event.stopPropagation();
                archive_email(item.id, button_name);
            });

            Object.values([item[email_to_show], item.subject, item.timestamp]).forEach(text => {
                const cell = document.createElement('td');
                const textNode = document.createTextNode(text);
                cell.appendChild(textNode);
                row.appendChild(cell);
                row.appendChild(btn);
            });

            if (item.read === true) {
                row.style.backgroundColor = '#EEEEEE';
            }

            table.appendChild(row);

        });
    } else {
        data.forEach(item => {
            const row = document.createElement('tr');
            // what to do on click
            row.addEventListener('click', () => read_email(item.id));

            Object.values([item[email_to_show], item.subject, item.timestamp]).forEach(text => {
                const cell = document.createElement('td');
                const textNode = document.createTextNode(text);
                cell.appendChild(textNode);
                row.appendChild(cell);
            });

            table.appendChild(row);

        });
    }

    return table;
}
