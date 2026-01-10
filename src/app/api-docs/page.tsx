import { Metadata } from 'next';
import { ApiDocsClient } from './ApiDocsClient';

export const metadata: Metadata = {
  title: 'API Documentation | Inner Circle Partners',
  description: 'API documentation for the Inner Circle Partners Portal',
};

export default function ApiDocsPage() {
  return <ApiDocsClient />;
}
