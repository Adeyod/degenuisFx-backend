import { faker } from '@faker-js/faker';

const generateUsers = (num) => {
  const users = [];

  for (let i = 0; i < num; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const middleName = faker.person.middleName();
    const email = faker.internet.email({ firstName, lastName });
    const password = faker.string.uuid();
    const phoneNumber = faker.phone.number();
    const address = faker.address.streetAddress();
    const countryOfResidence = faker.address.country();
    const stateOfResidence = faker.address.state();
    const gender = faker.person.sex();
    const DOB = faker.date.birthdate();

    users.push({
      firstName,
      lastName,
      middleName,
      email,
      password,
      phoneNumber,
      address,
      countryOfResidence,
      stateOfResidence,
      gender: gender.charAt(0).toUpperCase() + gender.slice(1),
      DOB,
    });
  }

  return users;
};

export default generateUsers;
