# OpenTripPlanner GTFS Reloader
It checks updates for a remote GTFS file and then reloads it on your OpenTripPlanner running application.

### Configuration

You need to set environment variables, before starting app, in `.env` file.
```shell
REMOTE_FILE_URL=https://<your-domain>/<your-file>
LOCAL_FILE_URL=./download/example.zip
OTP_URL=htpps://<your-opentripplanner-hostname>
OTP_ROUTER=<router-name-your-want-to-update>
```
\
Other params can be set in `config.js` file.
### Start application
```shell
npm start
```
