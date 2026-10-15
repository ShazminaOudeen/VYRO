import { useState, type KeyboardEvent } from 'react';
import { Modal, Form, Input, InputNumber, DatePicker, Select, message, Row, Col } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { useUser } from '../../context/useUser';
import { createGymClass, getApiErrorMessage } from '../../api/client';
import type { GymClass } from '../../types';

interface CreateClassModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    existingClasses?: GymClass[];
}

interface FormValues {
    title: string;
    coach: string;
    startsAt: Dayjs;
    durationMinutes: number;
    capacity: number;
}

export function CreateClassModal({ open, onClose, onSuccess, existingClasses = [] }: CreateClassModalProps) {
    const { users, currentUser } = useUser();
    const [form] = Form.useForm<FormValues>();
    const [submitting, setSubmitting] = useState(false);

    // Filter registered staff members for the coach dropdown
    const staffMembers = users.filter((u) => u.role === 'STAFF');

    // Intercept keyboard input to physically block letters, signs, and symbols
    const blockNonNumericKeys = (e: KeyboardEvent<HTMLInputElement>) => {
        if (
            ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(
                e.key
            )
        ) {
            return;
        }
        if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
            return;
        }
        if (!/^[0-9]$/.test(e.key)) {
            e.preventDefault();
        }
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);

            await createGymClass({
                title: values.title.trim(),
                coach: values.coach.trim(),
                startsAt: values.startsAt.toISOString(),
                durationMinutes: Number(values.durationMinutes),
                capacity: Number(values.capacity),
            });

            message.success(`Class "${values.title}" created successfully!`);
            form.resetFields();
            onSuccess();
            onClose();
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'errorFields' in err) {
                return;
            }
            message.error(getApiErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        onClose();
    };

    // Prevent selecting past calendar dates
    const disabledDate = (current: Dayjs) => {
        return current && current.isBefore(dayjs().startOf('day'));
    };

    // For today's date, disable hours and minutes that have already passed
    const disabledTime = (current: Dayjs | null) => {
        if (!current || !current.isSame(dayjs(), 'day')) {
            return {};
        }
        const currentHour = dayjs().hour();
        const currentMinute = dayjs().minute();

        return {
            disabledHours: () => Array.from({ length: currentHour }, (_, i) => i),
            disabledMinutes: (selectedHour: number) => {
                if (selectedHour === currentHour) {
                    return Array.from({ length: currentMinute }, (_, i) => i);
                }
                return [];
            },
        };
    };

    return (
        <Modal
            title="Create New Gym Class"
            open={open}
            onOk={handleSubmit}
            onCancel={handleCancel}
            okText="Create Class"
            confirmLoading={submitting}
            destroyOnClose
            width={520}
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={{
                    coach: currentUser?.role === 'STAFF' ? currentUser.name : undefined,
                    durationMinutes: 60,
                    capacity: 10,
                }}
                style={{ marginTop: 16 }}
            >
                {/* Title with duplicate prevention */}
                <Form.Item
                    name="title"
                    label="Class Title"
                    rules={[
                        { required: true, message: 'Please enter a class title' },
                        { whitespace: true, message: 'Title cannot be only whitespace' },
                        { max: 120, message: 'Title cannot exceed 120 characters' },
                        {
                            validator(_, value: string) {
                                if (!value) return Promise.resolve();
                                const trimmed = value.trim().toLowerCase();
                                const exists = existingClasses.some(
                                    (c) => c.title.trim().toLowerCase() === trimmed
                                );
                                if (exists) {
                                    return Promise.reject(
                                        new Error('A class with this title already exists on the schedule')
                                    );
                                }
                                return Promise.resolve();
                            },
                        },
                    ]}
                >
                    <Input
                        placeholder="e.g. Sunrise Yoga, HIIT Blast, Strength Circuit"
                        maxLength={120}
                        showCount
                    />
                </Form.Item>

                {/* Coach Select Dropdown */}
                <Form.Item
                    name="coach"
                    label="Coach / Instructor"
                    rules={[{ required: true, message: 'Please select a coach from registered staff' }]}
                >
                    <Select
                        placeholder="Select a registered staff coach"
                        options={staffMembers.map((staff) => ({
                            label: `${staff.name} (${staff.email})`,
                            value: staff.name,
                        }))}
                    />
                </Form.Item>

                {/* Date & Time with disabled past hours for today */}
                <Form.Item
                    name="startsAt"
                    label="Class Date & Start Time"
                    rules={[
                        { required: true, message: 'Please select start date and time' },
                        {
                            validator(_, value: Dayjs) {
                                if (!value || typeof value.isValid !== 'function' || !value.isValid()) {
                                    return Promise.reject(new Error('Please select a valid date and time'));
                                }
                                if (value.isBefore(dayjs())) {
                                    return Promise.reject(new Error('Start time must be in the future'));
                                }
                                return Promise.resolve();
                            },
                        },
                    ]}
                >
                    <DatePicker
                        showTime={{ format: 'h:mm A', use12Hours: true }}
                        format="YYYY-MM-DD h:mm A"
                        disabledDate={disabledDate}
                        disabledTime={disabledTime}
                        inputReadOnly
                        style={{ width: '100%' }}
                        placeholder="Select start date and time"
                    />
                </Form.Item>

                <Row gutter={16}>
                    {/* Duration */}
                    <Col span={12}>
                        <Form.Item
                            name="durationMinutes"
                            label="Duration (minutes)"
                            extra="Allowed: 15–180 mins"
                            rules={[
                                { required: true, message: 'Duration is required' },
                                {
                                    validator(_, value) {
                                        if (value === undefined || value === null || value === '') {
                                            return Promise.reject(new Error('Duration is required'));
                                        }
                                        const num = Number(value);
                                        if (isNaN(num)) {
                                            return Promise.reject(new Error('Duration must be a valid number'));
                                        }
                                        if (!Number.isInteger(num)) {
                                            return Promise.reject(new Error('Duration must be a whole number'));
                                        }
                                        if (num < 15 || num > 180) {
                                            return Promise.reject(new Error('Duration must be between 15 and 180 minutes'));
                                        }
                                        return Promise.resolve();
                                    },
                                },
                            ]}
                        >
                            <InputNumber
                                min={15}
                                max={180}
                                precision={0}
                                onKeyDown={blockNonNumericKeys}
                                style={{ width: '100%' }}
                                placeholder="e.g. 60"
                            />
                        </Form.Item>
                    </Col>

                    {/* Capacity */}
                    <Col span={12}>
                        <Form.Item
                            name="capacity"
                            label="Max Capacity (seats)"
                            extra="Allowed: 1–50 seats"
                            rules={[
                                { required: true, message: 'Capacity is required' },
                                {
                                    validator(_, value) {
                                        if (value === undefined || value === null || value === '') {
                                            return Promise.reject(new Error('Capacity is required'));
                                        }
                                        const num = Number(value);
                                        if (isNaN(num)) {
                                            return Promise.reject(new Error('Capacity must be a valid number'));
                                        }
                                        if (!Number.isInteger(num)) {
                                            return Promise.reject(new Error('Capacity must be a whole number'));
                                        }
                                        if (num < 1 || num > 50) {
                                            return Promise.reject(new Error('Capacity must be between 1 and 50 seats'));
                                        }
                                        return Promise.resolve();
                                    },
                                },
                            ]}
                        >
                            <InputNumber
                                min={1}
                                max={50}
                                precision={0}
                                onKeyDown={blockNonNumericKeys}
                                style={{ width: '100%' }}
                                placeholder="e.g. 10"
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Modal>
    );
}
