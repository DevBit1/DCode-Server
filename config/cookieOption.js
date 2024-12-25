
exports.cookieOption = {
    expires: new Date(Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    sameSite: 'None', // allows for cross-origin cookie sending , its required here bcs our backend and frontend are on different ports
    httpOnly: true, // ensures cookie is accessible to only web server and not client side JS
    secure: true // ensures cookie are sent only on HTTPS rather than insecure HTTP // "true" won't let us use it with api agents
}