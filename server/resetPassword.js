import bcrypt from "bcryptjs";

const password = "radhika123"; // Plain text password
const saltRounds = 10; // Number of salt rounds

const hashPassword = async () => {
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log("Hashed Password:", hashedPassword);
  } catch (error) {
    console.error("Error hashing password:", error);
  }
};

hashPassword();
