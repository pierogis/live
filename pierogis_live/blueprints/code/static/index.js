const apiEndpoint = '/api/1/';

const vm = new Vue({ // Again, vm is our Vue instance's name for consistency.
    el: '#codeModel',
    delimiters: ['[[', ']]'],
    data: {
        greeting: 'Hello, Vue!',
        flaskGreeting: ''
    },
    created: async function(){
        
        const response = await fetch(apiEndpoint + 'codes');
        const responseJson = await response.json();
        this.flaskGreeting = responseJson.greeting;
    }
})