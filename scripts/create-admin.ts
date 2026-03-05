import { db } from '../src/lib/db';
import bcrypt from 'bcryptjs';

async function createAdmin() {
  const email = 'admin@investigation.com';
  const username = 'admin';
  const password = 'Admin@123456';
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const user = await db.user.create({
      data: {
        email,
        username,
        passwordHash,
        firstName: 'System',
        lastName: 'Admin',
        role: 'ADMIN',
        isActive: true,
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('📧 Email:', email);
    console.log('👤 Username:', username);
    console.log('🔑 Password:', password);
    console.log('');
    console.log('⚠️  Please change the password after first login!');
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log('⚠️  Admin user already exists. Updating password...');
      await db.user.update({
        where: { email },
        data: {
          passwordHash,
          role: 'ADMIN',
          isActive: true,
        },
      });
      console.log('✅ Admin user updated successfully!');
      console.log('');
      console.log('📧 Email:', email);
      console.log('👤 Username:', username);
      console.log('🔑 Password:', password);
    } else {
      throw error;
    }
  }

  process.exit(0);
}

createAdmin();
