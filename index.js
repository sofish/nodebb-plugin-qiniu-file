// modified from: nodebb-plugin-imgur
// https://github.com/barisusakli/nodebb-plugin-imgur

'use strict';

const DB_SETTING_KEY = 'nodebb-plugin-qiniu-file';
const DB = module.parent.require('./database');
const qiniu = require('qiniu');

(function (E) {

  E.init = function (params, callback) {

    params.router.get('/admin/plugins/qiniu', params.middleware.applyCSRF, params.middleware.admin.buildHeader, renderAdmin);
    params.router.get('/api/admin/plugins/qiniu', params.middleware.applyCSRF, renderAdmin);
    params.router.post('/api/admin/plugins/qiniu/save', params.middleware.applyCSRF, saveSettings);

    callback();
  };

  E.upload = function (data, callback) {

    new Promise(function (r, rj) {
      DB.getObject(DB_SETTING_KEY, function (err, res) {
        if (err) return rj(err);
        r(res);
      })
    }).then(function (settings) {
      if (!settings || !settings.key || !settings.secret || !settings.bucket || !settings.domain) return callback(new Error('invaild key, secret or bucket'));
      doUpload(data, settings, callback);
    }).catch(function (err) {
      callback(new Error(err));
    });

  };

  var admin = {};

  admin.menu = function (menu, callback) {
    menu.plugins.push({
      route: '/plugins/qiniu',
      icon: 'fa-cloud-upload',
      name: 'Qiniu CDN'
    });

    callback(null, menu);
  };

  E.admin = admin;

  function renderAdmin(req, res, next) {
    DB.getObject(DB_SETTING_KEY, function (err, settings) {
      if (err) return next(err);

      settings = settings || {};
      res.render('admin/plugins/qiniu', {
        settings: {
          key: settings.key,
          secret: settings.secret,
          bucket: settings.bucket,
          domain: settings.domain
        }, csrf: req.csrfToken()
      });
    });
  }

  function saveSettings(req, res, next) {
    var data = {
      key: req.body.key || '',
      secret: req.body.secret || '',
      bucket: req.body.bucket || '',
      domain: req.body.domain || ''
    };

    DB.setObject(DB_SETTING_KEY, data, function (err) {
      if (err) return next(err)
      res.status(200).json({message: 'Settings saved!'});
    });
  }

  function doUpload(data, settings, callback) {

    var file = data.image || data.file;
    var type = file.url ? 'url' : 'file';

    if (type === 'file' && !file.path) {
      return callback(new Error('invalid file path'));
    }

    var mac = new qiniu.auth.digest.Mac(settings.key, settings.secret);
    var config = new qiniu.conf.Config();

    if (type === 'file') {
      var uploadToken = new qiniu.rs.PutPolicy({scope: settings.bucket}).uploadToken(mac);
      var putExtra = new qiniu.form_up.PutExtra();
      var formUploader = new qiniu.form_up.FormUploader(config);

      formUploader.putFile(uploadToken, null, file.path, putExtra, response);
    } else if (type === 'url') {
      var bucketManager = new qiniu.rs.BucketManager(mac, config);
      bucketManager.fetch(file.url, settings.bucket, file.url.slice(file.url.lastIndexOf("/")), response);
    } else {
      return callback(new Error('unknown-type'));
    }

    function response(err, body, info) {
      if (err) return callback(err);

      if (info.statusCode == 200) {
        return callback(null, {
          url: settings.domain.replace(/\/$/, '') + '/' + body.hash,
          name: body.key
        });
      }

      callback(new Error('unknown error occurs while uploading'));
    }

  }
}(module.exports));

