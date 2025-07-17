import bcrypt from "bcryptjs";

const storedHashedPassword = "$2a$10$mcPMtIKZS12jRaNf2PIq.ON6hgG9jTQ0Wnx2rDiK.EFnhHyfrIGP6"; // Your stored hash
const enteredPassword = "radhika123"; // The password to check

const testPassword = async () => {
  const isMatch = await bcrypt.compare(enteredPassword, storedHashedPassword);
  console.log("Password Match:", isMatch);
};

testPassword();
