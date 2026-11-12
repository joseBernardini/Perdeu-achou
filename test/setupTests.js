import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

configure({ asyncUtilTimeout: 4000 });

window.scrollTo = jest.fn();
Element.prototype.scrollIntoView = jest.fn();
