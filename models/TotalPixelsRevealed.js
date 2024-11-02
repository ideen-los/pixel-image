import { DataTypes } from 'sequelize';
import sequelize from '../db.js';

const TotalPixelsRevealed = sequelize.define('TotalPixelsRevealed', {
  pixelCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
});

export default TotalPixelsRevealed;
