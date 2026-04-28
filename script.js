// 🔹 Query History (RESET EVERY LOAD)
let historyList = [];

// 🔹 Reset history on reload
window.onload = function () {
    localStorage.removeItem("queries");
    displayHistory();
};

// 🔹 Run Query
async function runQuery() {
    let query = document.getElementById("queryInput").value;
    let status = document.getElementById("status");
    let output = document.getElementById("output");

    if (!query) {
        status.innerText = "❌ Please enter a query";
        output.innerHTML = "";
        document.getElementById("tokensBox").innerHTML = ""; // 🔥 clear tokens
        return;
    }

    status.innerText = "⏳ Running query...";

    try {
        let res = await fetch("http://localhost:3000/query", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ query })
        });

        let data = await res.json();

        // ❌ Invalid Query
       if (data.error) {
    status.innerText = "❌ " + data.error;
    output.innerHTML = "";

    // 🔥 IMPORTANT: clear first
    let box = document.getElementById("tokensBox");
    box.innerHTML = "";

    // 🔥 THEN show tokens if present
    if (data.tokens && data.tokens.length > 0) {
        displayTokens(data.tokens);
    } else {
        box.innerHTML = "<p>No tokens generated</p>";
    }

    return;
}

        // ✅ Valid Query
        status.innerText = "✅ Query executed successfully";

        // 🔹 Show Result Table
        displayTable(data.result || data);

        // 🔥 SHOW TOKENS IN TABLE (NEW)
        if (data.tokens) {
            displayTokens(data.tokens);
        }

        // Save history
        historyList.unshift(query);
        displayHistory();

    } catch (err) {
        status.innerText = "❌ Server error!";
        output.innerHTML = "";
        document.getElementById("tokensBox").innerHTML = "";
    }
}

// 🔹 Display Output in Table
function displayTable(data) {
    let output = document.getElementById("output");

    if (!data.length) {
        output.innerHTML = "<p>No results found</p>";
        return;
    }

    let table = "<table border='1'><tr>";

    Object.keys(data[0]).forEach(key => {
        table += `<th>${key}</th>`;
    });

    table += "</tr>";

    data.forEach(row => {
        table += "<tr>";
        Object.values(row).forEach(val => {
            table += `<td>${val}</td>`;
        });
        table += "</tr>";
    });

    table += "</table>";

    output.innerHTML = table;
}

// 🔥 NEW FUNCTION (TOKENS TABLE)
function displayTokens(tokens) {
    let box = document.getElementById("tokensBox");

    let table = "<table border='1'><tr><th>Token</th><th>Type</th></tr>";

    tokens.forEach(t => {
        table += `<tr>
                    <td>${t.value}</td>
                    <td>${t.type}</td>
                  </tr>`;
    });

    table += "</table>";

    box.innerHTML = table;
}

// 🔹 Show History
function displayHistory() {
    let ul = document.getElementById("history");
    ul.innerHTML = "";

    historyList.forEach(q => {
        let li = document.createElement("li");
        li.innerText = q;

        li.onclick = () => {
            document.getElementById("queryInput").value = q;
        };

        ul.appendChild(li);
    });
}

// 🔹 Dark Mode Toggle
function toggleDark() {
    document.body.classList.toggle("dark");
}