Vue.component('video', {
  data: function () {
    return {
      count: 0
    }
  },
  template: `
        <video class="v-video" height="500" controls>
            <source src="{{ video.path }}" type="video/mp4">
            Your browser does not support the video tag.
        </video>
  `
})