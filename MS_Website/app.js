'use strict'

//This is a single line comment

/* This is a 
    multi-line comment
    which can span multiple lines*/

//console.log('Inactive code')

let today=new Date()
let formatDate=today.toDateString()
let selectElement=document.getElementById('date')
selectElement.innerHTML=formatDate

console.log('Here\'s a hidden message');