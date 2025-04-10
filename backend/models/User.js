// backend/models/User.js
const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcryptjs'); // Import bcrypt
const { sequelize } = require('../config/database');

class User extends Model {
  // Instance method to check password
  async isValidPassword(password) {
    return bcrypt.compare(password, this.passwordHash);
  }
}

User.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true,
    }
  },
  passwordHash: { // Store the hashed password, not the plain text
    type: DataTypes.STRING,
    allowNull: false,
    field: 'password_hash'
  },
  // Add other user fields later if needed (name, role, etc.)
  // Timestamps automatically added
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  timestamps: true,
  underscored: true,
  // --- Hooks for Hashing Password ---
  hooks: {
    // Before creating a new user or updating the password (if password change is allowed)
    beforeSave: async (user, options) => {
      if (user.changed('passwordHash')) { // Check if password field was actually changed/set
        const salt = await bcrypt.genSalt(10); // Generate salt
        user.passwordHash = await bcrypt.hash(user.passwordHash, salt); // Hash the password
      }
    },
    // Optional: Hook before bulk creation if needed
    // beforeBulkCreate: async (users, options) => { ... }
  }
});

// Important: Remove passwordHash from default JSON output
User.prototype.toJSON = function () {
  const values = { ...this.get() }; // Get all model values
  delete values.passwordHash; // Remove sensitive hash
  return values;
};

module.exports = User;