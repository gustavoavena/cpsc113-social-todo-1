$(document).ready(function() {
  $(".add-participants").select2({
    multiple: true,
    width: '500px',
    tokenSeparators: [',', ' '],
    ajax: {
      url: "/user/search",
      dataType: 'json',
      delay: 250,
      data: function (params) {
        return {
          q: params.term, // search term
          page: params.page
        };
      },
      processResults: function (data, params) {
        return {
          results: $.map(data.results, function(item) {
            return {
              text: item.text,
              id: item.id
            }
          })
        };
      },
      cache: true
    },
    minimumInputLength: 3,
    formatResult: function(item) {
      return "div class='select2-user-result'>" + item.text + "</div";
    },
  });

  $(".mat-input").focus(function(){
    $(this).parent().addClass("is-active is-completed");
  });

  $(".mat-input").focusout(function(){
    if($(this).val() === "")
      $(this).parent().removeClass("is-completed");
    $(this).parent().removeClass("is-active");
  })

  $("#toggle-create").click(function() {
    $(this).slideUp(function() {
      $('.container').slideDown();
    });
  })

  $(".tasks-list-item").click(function() {
    $(this).find('form.toggle-complete-status').submit();
  });
});