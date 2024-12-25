

const template = (email, name, password) => {
    return (
        `<!DOCTYPE html>
            <html lang="en">

            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Mail from server</title>
            </head>

            <body>
                <h1>Welcome to the coding platform ${name}</h1>
                <p>Before using the app you will be redirected to reset your code, please provide a password while resetting</p>
                <div>
                    <p>User Email : ${email}</p>
                    <p>Temporary password : ${password}</p>
                </div>
            </body>
        `
    )
}

module.exports = template