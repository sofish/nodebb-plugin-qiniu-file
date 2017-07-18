<form class="form" id="qiniu-form">
	<div class="row">
		<div class="col-sm-6 col-xs-12">
			<div class="form-group">
				<label>App Key</label>
				<input id="key" type="text" class="form-control" placeholder="app key" value="{settings.key}">
			</div>
			<div class="form-group">
				<label>App Secret</label>
				<input id="secret" type="text" class="form-control" placeholder="app secret" value="{settings.secret}">
			</div>
			<div class="form-group">
				<label>Bucket</label>
				<input id="bucket" type="text" class="form-control" placeholder="指定一个 bucket" value="{settings.bucket}">
			</div>
			<div class="form-group">
        <label>绑定的域名</label>
        <input id="domain" type="text" class="form-control" placeholder="绑定的域名，如 https://example.com" value="{settings.domain}">
      </div>
		</div>
	</div>
</form>

<button class="btn btn-primary" id="save">Save</button>

<input id="csrf_token" type="hidden" value="{csrf}" />

<script type="text/javascript">
	$('#save').on('click', function() {
		var data = {
			_csrf: $('#csrf_token').val(),
			key: $('#qiniu-form #key').val(),
			secret: $('#qiniu-form #secret').val(),
			bucket: $('#qiniu-form #bucket').val(),
			domain: $('#qiniu-form #domain').val()
		};

		$.post(config.relative_path + '/api/admin/plugins/qiniu/save', data, function(data) {
			app.alertSuccess(data.message);
		});

		return false;
	});
</script>

