import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

jest.mock('../src/services/authService', () => require('../src/services/mock/mockAuthService'));
jest.mock('../src/services/objectService', () => require('../src/services/mock/mockObjectService'));
jest.mock('../src/services/recoveryRequestService', () => require('../src/services/mock/mockRecoveryRequestService'));
jest.mock('../src/services/adminService', () => require('../src/services/mock/mockAdminService'));

configure({ asyncUtilTimeout: 4000 });

window.scrollTo = jest.fn();
Element.prototype.scrollIntoView = jest.fn();
