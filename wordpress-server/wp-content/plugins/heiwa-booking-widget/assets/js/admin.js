(function($){
  $(document).ready(function(){
    var $btn = $('#heiwa-test-connection');
    var $result = $('#heiwa-connection-result');
    if (!$btn.length) return;

    function setStatus(type, message){
      $result.removeClass('heiwa-success heiwa-error heiwa-info');
      if (type === 'success') $result.addClass('heiwa-success');
      if (type === 'error') $result.addClass('heiwa-error');
      if (type === 'info') $result.addClass('heiwa-info');
      $result.text(message);
    }

    $btn.on('click', function(){
      if (!window.heiwaBookingAdmin) return;
      $btn.prop('disabled', true);
      setStatus('info', window.heiwaBookingAdmin.strings?.testing || 'Testing connection...');
      $.ajax({
        url: window.heiwaBookingAdmin.ajaxUrl,
        method: 'POST',
        dataType: 'json',
        data: {
          action: 'heiwa_test_connection',
          nonce: window.heiwaBookingAdmin.nonce
        }
      }).done(function(resp){
        if (resp && resp.success) {
          setStatus('success', window.heiwaBookingAdmin.strings?.success || 'Connection successful!');
        } else {
          setStatus('error', (resp && (resp.message || resp.error)) || (window.heiwaBookingAdmin.strings?.error || 'Connection failed.'));
        }
      }).fail(function(xhr){
        var msg = (xhr && xhr.responseJSON && (xhr.responseJSON.message || xhr.responseJSON.error)) || 'Request failed';
        setStatus('error', msg);
      }).always(function(){
        $btn.prop('disabled', false);
      });
    });
  });
})(jQuery);

