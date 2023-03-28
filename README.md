# basic express server

```
node app.js
```

## in terminal use curl to perform a GET request

```
curl localhost:3000/hello
```

## in terminal use curl to perform a POST request, when curl has data flag it knows it uses POST method

```
curl --header 'content-type: application/json' localhost:3000/hello --data '{"foo":"bar"}'
```

# basic http server then go to localhost:3000 from browser
```
node http.js
```
