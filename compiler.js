// ================= TOKEN TYPES =================
const TokenType = {
    KEYWORD: "KEYWORD",
    IDENTIFIER: "IDENTIFIER",
    OPERATOR: "OPERATOR",
    VALUE: "VALUE",
    COMMA: "COMMA",
    STAR: "STAR"
};

// ================= LEXICAL ANALYZER =================
function tokenize(query) {
    const keywords = ["SELECT", "FROM", "WHERE", "AND", "OR", "LIKE"];
    const operators = ["=", ">", "<", ">=", "<="];

    let rawTokens = query
        .replace(/,/g, ' , ')
        .replace(/>=/g, ' >= ')
        .replace(/<=/g, ' <= ')
        .replace(/>/g, ' > ')
        .replace(/</g, ' < ')
        .replace(/=/g, ' = ')
        .split(/\s+/)
        .filter(t => t.length > 0);

    let tokens = [];

    for (let token of rawTokens) {
        let upper = token.toUpperCase();

        if (keywords.includes(upper)) {
            tokens.push({ type: TokenType.KEYWORD, value: upper });
        }
        else if (operators.includes(token)) {
            tokens.push({ type: TokenType.OPERATOR, value: token });
        }
        else if (token === ",") {
            tokens.push({ type: TokenType.COMMA, value: token });
        }
        else if (token === "*") {
            tokens.push({ type: TokenType.STAR, value: token });
        }
        else if (token.startsWith("'") && token.endsWith("'")) {
            tokens.push({ type: TokenType.VALUE, value: token });
        }
        else if (!isNaN(token)) {
            tokens.push({ type: TokenType.VALUE, value: Number(token) });
        }
        else if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(token)) {
            tokens.push({ type: TokenType.IDENTIFIER, value: token });
        }
        else {
            // 🔥 IMPORTANT CHANGE
            tokens.push({ type: "INVALID", value: token });

            // throw AFTER storing token
            throw new Error("Lexical Error: Invalid token -> " + token);
        }
    }

    return tokens;
}

// ================= SYNTAX ANALYZER =================
function parse(tokens) {
    let i = 0;

    function match(type, value = null) {
        let token = tokens[i];
        if (!token || token.type !== type || (value && token.value !== value)) {
            throw new Error("Syntax Error near: " + (token?.value || "EOF"));
        }
        i++;
        return token;
    }

    match("KEYWORD", "SELECT");

    let fields = [];

    if (tokens[i]?.type === "STAR") {
        fields.push("*");
        i++;
    } else {
        while (tokens[i] && tokens[i].value !== "FROM") {
            if (tokens[i].type === "IDENTIFIER") {
                fields.push(tokens[i].value);
                i++;
                if (tokens[i]?.type === "COMMA") i++;
            } else {
                throw new Error("Syntax Error in field list");
            }
        }
    }

    if (fields.length === 0) {
        throw new Error("Syntax Error: No fields specified");
    }

    match("KEYWORD", "FROM");

    let table = match("IDENTIFIER").value;

    let conditions = [];

    if (tokens[i]?.value === "WHERE") {
        match("KEYWORD", "WHERE");

        while (i < tokens.length) {
            let field = match("IDENTIFIER").value;

            let opToken = tokens[i];
            if (!opToken || (opToken.type !== "OPERATOR" && opToken.value !== "LIKE")) {
                throw new Error("Syntax Error: Invalid operator near " + (opToken?.value || "EOF"));
            }
            i++;
            let operator = opToken.value;

            let value = match("VALUE").value;

            conditions.push({ field, operator, value });

            let next = tokens[i]?.value;

            if (next === "AND" || next === "OR") {
                conditions.push({ type: next });
                i++;
            } else break;
        }
    }

    return { fields, table, conditions };
}

// ================= LIKE SUPPORT =================
function likeToRegex(pattern) {
    pattern = pattern.replace(/'/g, "");
    return new RegExp("^" + pattern.replace(/%/g, ".*").replace(/_/g, ".") + "$", "i");
}

// ================= CONDITION =================
function evaluateCondition(row, cond) {

    if (!(cond.field in row)) {
        throw new Error("Execution Error: Invalid field -> " + cond.field);
    }

    let value;

    if (typeof cond.value === "string") {
        value = cond.value.replace(/'/g, "").toLowerCase();
    } else {
        value = cond.value;
    }

    let fieldValue = row[cond.field];
    let fieldValueStr = String(fieldValue).toLowerCase();

    switch (cond.operator) {
        case "=":
            return fieldValueStr === value;

        case ">":
            return fieldValue > Number(value);

        case "<":
            return fieldValue < Number(value);

        case ">=":
            return fieldValue >= Number(value);

        case "<=":
            return fieldValue <= Number(value);

        case "LIKE":
            return likeToRegex(value).test(fieldValue);

        default:
            throw new Error("Execution Error: Unsupported operator");
    }
}

// ================= EXECUTION =================
function execute(ast, data) {
    let filtered = data;

    if (ast.conditions.length > 0) {
        filtered = data.filter(row => {

            let result = evaluateCondition(row, ast.conditions[0]);

            for (let i = 1; i < ast.conditions.length; i += 2) {
                let logic = ast.conditions[i].type;
                let nextCond = ast.conditions[i + 1];

                let nextResult = evaluateCondition(row, nextCond);

                if (logic === "AND") result = result && nextResult;
                else if (logic === "OR") result = result || nextResult;
            }

            return result;
        });
    }

    return filtered.map(row => {
        if (ast.fields.includes("*")) return row;

        let obj = {};
        ast.fields.forEach(f => obj[f] = row[f]);
        return obj;
    });
}

// ================= COMPILER =================
function compile(query, data) {
    let tokens = [];

    try {
        // 🔹 Phase 1: Lexical
        tokens = tokenize(query);

        try {
            // 🔹 Phase 2: Syntax
            let ast = parse(tokens);

            // 🔹 Phase 3: Execution
            let result = execute(ast, data);

            return { tokens, ast, result };

        } catch (err) {
            // 🔥 Syntax error → tokens still return
            return { tokens, error: err.message };
        }

    } catch (err) {
        // 🔥 Lexical error → tokens MAY be partial or empty
        return { tokens, error: err.message };
    }
}

module.exports = { compile };