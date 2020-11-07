const apiEndpoint = '/api/1/';

const form = new Vue({ // Again, vm is our Vue instance's name for consistency.
    el: '#form',
    delimiters: ['[[', ']]'],
    data: {
        greeting: 'Hello, Vue!',
        flaskGreeting: ''
    },
    created: async function () {
        const response = await fetch(apiEndpoint + 'greeting');
        const responseJson = await response.json();
        this.flaskGreeting = responseJson.greeting;
    },
    methods: {

        uploadImage(event) {

            const URL = 'http://foobar.com/upload';

            let data = new FormData();
            data.append('name', 'my-picture');
            data.append('file', event.target.files[0]);

            let config = {
                header: {
                    'Content-Type': 'image/png'
                }
            }

            axios.put(
                URL,
                data,
                config
            ).then(
                response => {
                    console.log('image upload response > ', response)
                }
            )
        }
    }
})
