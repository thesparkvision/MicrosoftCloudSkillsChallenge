//@ts-check
var question=require('readline-sync').question;

//importing cosmos package for working with COSMOS DB
var cosmos=require("@azure/cosmos");

var config={
    connectionString:"CONNECTION_STRING_OF_COSMOS_DB_ACCOUNT",
    database:"SchoolDB",
    container:"StudentCourseGrades",
}

//creating CosmosClient Object to make connections
const client=new cosmos.CosmosClient(config.connectionString)

//creating reference to container and accessing data
const databaseid=config.database;
const containerid=config.container;
const containerref=client.database(databaseid).container(containerid);
const containerdata=containerref.items;

function isOK(statusCode){
    return statusCode>=200 && statusCode<=299;
}

async function addStudent(student){
    const{item,statusCode}=await containerdata.create(student).catch();
    isOK(statusCode) && process.stdout.write(`Added student with id: ${item.id} ${item.Forename}\n`);
}

async function updateStudent(student){
    const{item,statusCode}=await containerdata.upsert(student).catch();
    isOK(statusCode) && process.stdout.write(`Updated student with id: ${item.id}\n`);
}

async function deleteStudent(student){
    const{item,statusCode}=await containerref.item(student.id,student.StudentNumber).delete().catch();
    isOK(statusCode) && process.stdout.write(`Deleted student with id: ${item.id}\n`);
}

async function getStudent(ID,studentNumber){
    const {resource,statusCode}=await containerref.item(ID,studentNumber).read().catch();

    if(isOK(statusCode)){
        process.stdout.write(`Student data: ${resource.StudentNumber}: ${resource.Forename}, ${resource.Lastname}`);
        resource.CourseGrades.forEach(function(coursegrade){
            process.stdout.write(`${coursegrade.Course}:${coursegrade.Grade}\n`);
        });
        return new Student(resource.id,resource.StudentNumber,resource.ForeName,resource.LastName);
    }
    return null;
}

async function queryStudents(courseName){
    const studentquery={
        query:"SELECT s.StudentNumber,s.Forename,s.Lastname,c.Course,c.Grade\
              FROM students s JOIN c IN s.CourseGrades \
              WHERE c.Course=@coursename",
        parameters:[
            {
                name:"@coursename",
                value:courseName
            }
        ]
    };

    const {resources}=await containerdata.query(studentquery).fetchAll();
    for(let queryResult of resources){
        let resultString=JSON.stringify(queryResult);
        process.stdout.write(`\nQuery returned ${resultString}\n`);
    }
}
class Student{
    constructor(ID,studentNumber,forename,lastname)
    {
        this.id=ID;
        this.StudentNumber=studentNumber;
        this.Forename=forename;
        this.Lastname=lastname;
        this.CourseGrades=[]
        this.addGrade=function(coursename,grade){
            this.CourseGrades.push({Course:coursename,Grade:grade});;
        };
        this.toString=function(){
            return `${this.StudentNumber}: ${this.Forename}, ${this.Lastname}\n`
        };
        this.getGrades=function(){
            let grades="";
            this.CourseGrades.forEach(function(coursegrade){
                grades=`${grades}${coursegrade.Course}:${coursegrade.Grade}\n`
            });
            return grades;
        };
    }
}

function getStudentData(){
    let ID=question("Please enter the student's document ID: ");
    let studentNumber=question("Enter the student's Number: ");
    let forename=question("Enter the student's forename: ");
    let lastname=question("Enter the student's lastname: ");
    let student=new Student(ID,studentNumber,forename,lastname);
    return student;
}

async function test(){
    process.stdout.write("\n\nTesting addStudent and getStudent\n\n");

    //create student 1
    let student1=getStudentData();
    process.stdout.write(student1.toString());
    await addStudent(student1).then(
        ()=>getStudent(student1.id,student1.StudentNumber)
    );
    process.stdout.write("\n\n");

    //create student 2
    let student2=getStudentData();
    await addStudent(student2).then(
        ()=>getStudent(student2.id,student2.StudentNumber)
    );
    process.stdout.write("\n\n");

    //update student 1 with course and grades
    process.stdout.write("\n\nTesting updateStudent\n\n");
    student1.addGrade("Physics","A");
    student1.addGrade("Chemistry","C");
    await updateStudent(student1).then(
        ()=>getStudent(student1.id,student1.StudentNumber)
    );
    process.stdout.write("\n");

    //update student 2 with course and grades
    student2.addGrade("Physics","B");
    student2.addGrade("Mathematics","D");
    await updateStudent(student2).then(
        ()=>getStudent(student2.id,student2.StudentNumber)
    );
    process.stdout.write("\n");

    process.stdout.write("\n\nTesting queryStudents\n\n");
    process.stdout.write("Students who have taken Physics\n");
    await queryStudents("Physics");

    process.stdout.write("Students who have taken Computer Science\n");
    await queryStudents("Computer Science");

    //Delete the students that have taken Computer Science
    process.stdout.write("\n\nTesting deleteStudent\n\n");
    let oldStudent=await getStudent("S101","101");
    if(oldStudent){
        await deleteStudent(oldStudent).then(
            ()=>getStudent(oldStudent.id,oldStudent.StudentNumber)
        );
    }
    process.stdout.write("\n");

    oldStudent=await getStudent("S102","102");
    if(oldStudent){
        await deleteStudent(oldStudent).then(
            ()=>getStudent(oldStudent.id,oldStudent.StudentNumber)
        );
    }

    process.stdout.write("\n\nDone\n");
}

test();