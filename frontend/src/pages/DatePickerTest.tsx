import React, { useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import DatePicker from '../components/DatePicker';

const DatePickerTest: React.FC = () => {
  const [testDate, setTestDate] = useState('');

  const handleTest = () => {
    console.log('Test date value:', testDate);
    alert(`Giá trị đã nhập: ${testDate}`);
  };

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col md={6}>
          <Card>
            <Card.Header>
              <h4>Test DatePicker Auto-Format</h4>
            </Card.Header>
            <Card.Body>
              <p className="text-muted mb-3">
                Nhập số để test tính năng auto-format. Ví dụ: nhập "01012024" sẽ tự động thành "01/01/2024"
              </p>
              
              <DatePicker
                value={testDate}
                onChange={setTestDate}
                label="Ngày sinh"
                required
                placeholder="Nhập số (ví dụ: 01012024)"
              />
              
              <div className="mt-3">
                <Button variant="primary" onClick={handleTest}>
                  Test Giá Trị
                </Button>
              </div>
              
              <div className="mt-3">
                <small className="text-muted">
                  <strong>Giá trị hiện tại:</strong> {testDate || 'Chưa có'}
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default DatePickerTest;
