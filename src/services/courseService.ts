import prisma from "@/lib/prisma";


export const courseService = {
    async createCourse(data: {
        title: string;
        description?: string;
        teacherId: string;
    }) {
        const course = await prisma.course.create({
            data,
        });

        return course;
    },

    async cloneCourse(sourceCourseId: string, data: {
        title: string;
        description?: string;
        teacherId: string;
    }) {
        // 1. Get source course with all data needed for cloning
        const sourceCourse = await prisma.course.findUnique({
            where: { id: sourceCourseId },
            include: {
            }
        });

        if (!sourceCourse) {
            throw new Error("Course not found");
        }

        // 2. Create new course
        const newCourse = await prisma.course.create({
            data,
        });


        return newCourse;
    },

    async updateCourse(courseId: string, data: {
        title?: string;
        description?: string;
    }) {
        const course = await prisma.course.update({
            where: { id: courseId },
            data,
        });

        return course;
    },

    async getTeacherCourses(teacherId: string) {
        return await prisma.course.findMany({
            where: { teacherId },
            orderBy: { createdAt: "desc" },
            include: {
                _count: {
                    select: { enrollments: true },
                },
            },
        });
    },

    async getStudentCourses(userId: string) {
        const enrollments = await prisma.enrollment.findMany({
            where: {
                userId,
                status: 'APPROVED'
            },
            include: {
                course: {
                    include: {
                        teacher: {
                            select: { name: true, email: true }
                        }
                    }
                }
            }
        });

        return enrollments.map(e => e.course);
    },

    async getAllCourses() {
        return await prisma.course.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                teacher: {
                    select: { name: true, email: true },
                },
                _count: {
                    select: { enrollments: true },
                },
            },
        });
    },

    async getCourseById(courseId: string) {
        return await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                teacher: {
                    select: { id: true, name: true, email: true },
                },
                _count: {
                    select: {
                        enrollments: true,
                    },
                },
            },
        });
    },

    async deleteCourse(courseId: string) {
        return await prisma.course.delete({
            where: { id: courseId },
        });
    },

    async enrollStudent(userId: string, courseId: string, status: 'PENDING' | 'APPROVED' = 'PENDING') {
        // Check if course registration is open
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: {
                registrationOpen: true,
                registrationDeadline: true
            },
        });

        if (!course) {
            throw new Error("Course not found");
        }

        if (!course.registrationOpen) {
            throw new Error("Course registration is closed");
        }

        if (course.registrationDeadline && new Date() > course.registrationDeadline) {
            throw new Error("Course registration deadline has passed");
        }

        // Check if already enrolled
        const existing = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId,
                    courseId,
                },
            },
        });

        if (existing) return existing;

        return await prisma.enrollment.create({
            data: {
                userId,
                courseId,
                status: status as any,
            },
        });
    },

    async getStudentEnrollments(userId: string) {
        const enrollments = await prisma.enrollment.findMany({
            where: {
                userId,
                status: 'APPROVED'
            },
            include: {
                course: {
                    include: {
                        teacher: {
                            select: { name: true },
                        },
                        evaluationAttempts: {
                            include: {
                                evaluation: {
                                    select: {
                                        id: true,
                                        title: true,
                                        _count: {
                                            select: { questions: true }
                                        }
                                    }
                                },
                                submissions: {
                                    where: { userId }
                                }
                            },
                            orderBy: {
                                startTime: "asc"
                            }
                        }
                    },
                },
            },
        });

        const now = new Date(); // Capture time once

        // Calculate weighted average grade for each course and fetch remarks/attendance
        // We do this manually or via separate queries because nested filtering on the same level (user -> remarks) 
        // within an enrollment query can be tricky or less efficient if not careful. 
        // But actually, we can just fetch them separately or use a more complex include.
        // Let's try to fetch them in parallel for all enrollments to be efficient, or just iterate.
        // Given the scale, iterating is fine for now, or we can use the relation on User if we included User.
        // But we didn't include User in the findMany above.

        // Let's fetch additional data for each enrollment
        const enrichedEnrollments = await Promise.all(enrollments.map(async (enrollment) => {

            return {
                ...enrollment,
                averageGrade: 0
            };
        }));

        return enrichedEnrollments;
    },

    async getStudentPendingEnrollments(userId: string) {
        const enrollments = await prisma.enrollment.findMany({
            where: {
                userId,
                status: 'PENDING'
            },
            select: {
                courseId: true
            }
        });
        return enrollments.map(e => e.courseId);
    },

    async getPendingEnrollments(teacherId: string) {
        return await prisma.enrollment.findMany({
            where: {
                status: 'PENDING',
                course: {
                    teacherId: teacherId
                }
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    },

    async updateEnrollmentStatus(enrollmentId: string, status: 'APPROVED' | 'REJECTED') {
        // We no longer delete on REJECTED, we just update the status to suspend access
        return await prisma.enrollment.update({
            where: { id: enrollmentId },
            data: { status: status as any }
        });
    },


    async getCourseStudents(courseId: string) {
        return await prisma.enrollment.findMany({
            where: { courseId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                        profile: {
                            select: {
                                identificacion: true,
                                nombres: true,
                                apellido: true,
                                telefono: true,
                                dataProcessingConsent: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                user: {
                    name: 'asc'
                }
            }
        });
    },

    async searchStudents(query: string) {
        return await prisma.user.findMany({
            where: {
                role: "student",
                OR: [
                    { name: { contains: query, mode: "insensitive" } },
                    { email: { contains: query, mode: "insensitive" } },
                    {
                        profile: {
                            OR: [
                                { identificacion: { contains: query, mode: "insensitive" } },
                                { nombres: { contains: query, mode: "insensitive" } },
                                { apellido: { contains: query, mode: "insensitive" } },
                                { telefono: { contains: query, mode: "insensitive" } },
                            ],
                        },
                    },
                ],
            },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                profile: {
                    select: {
                        identificacion: true,
                        nombres: true,
                        apellido: true,
                        telefono: true,
                        dataProcessingConsent: true,
                    },
                },
            },
            take: 10,
        });
    },

    async removeStudentFromCourse(userId: string, courseId: string) {
        return await prisma.enrollment.deleteMany({
            where: {
                userId,
                courseId,
            },
        });
    },

    async toggleCourseRegistration(courseId: string) {
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: { registrationOpen: true },
        });

        if (!course) {
            throw new Error("Course not found");
        }

        return await prisma.course.update({
            where: { id: courseId },
            data: { registrationOpen: !course.registrationOpen },
        });
    },

    async updateCourseRegistration(courseId: string, isOpen: boolean, deadline?: Date) {
        return await prisma.course.update({
            where: { id: courseId },
            data: {
                registrationOpen: isOpen,
                registrationDeadline: deadline
            },
        });
    },

    async getStudentCourseEnrollment(userId: string, courseId: string) {
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId,
                    courseId,
                },
            },
            include: {
                course: {
                    include: {
                        teacher: {
                            select: { name: true },
                        },
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profile: {
                            select: {
                                identificacion: true,
                                nombres: true,
                                apellido: true,
                                dataProcessingConsent: true,
                            }
                        }
                    }
                }
            },
        });

        if (!enrollment) return null;

        // Calculate weighted average grade

        return {
            ...enrollment,
            averageGrade: 0
        };
    },

    async getCalendarEvents(userId: string, role: string, studentId?: string) {
        let courses;
        let remarks: any[] = [];

        if (role === "teacher") {
            courses = await prisma.course.findMany({
                where: { teacherId: userId },
                include: {
                }
            });

            // Fetch remarks for teachers (all students in their courses)
            // Filter by studentId if provided
            if (studentId) {
                remarks = await prisma.remark.findMany({
                    where: {
                        course: { teacherId: userId },
                        userId: studentId
                    },
                    include: { course: { select: { title: true } } }
                });
            } else {
                remarks = await prisma.remark.findMany({
                    where: { course: { teacherId: userId } },
                    include: { course: { select: { title: true } } }
                });
            }
        } else {
            const enrollments = await prisma.enrollment.findMany({
                where: { userId },
                include: {
                    course: {
                        include: {
                        },
                    },
                },
            });
            courses = enrollments.map(e => e.course);

            // Fetch remarks for students
            remarks = await prisma.remark.findMany({
                where: { userId },
                include: { course: { select: { title: true } } }
            });
        }

        const events: any[] = [];

        courses.forEach(course => {
        });

        // Map Remarks
        remarks.forEach(remark => {
            const color = '#3b82f6'; // Blue for all Remarks
            const title = remark.type === 'ATTENTION' ? 'Atención' : 'Felicitación';

            events.push({
                id: `remark-${remark.id}`,
                title: remark.title,
                startAt: remark.date,
                endAt: remark.date,
                status: { name: title, color: color },
                type: 'REMARK',
                details: {
                    courseName: remark.course.title,
                    type: remark.type,
                    description: remark.description
                }
            });
        });

        return events;
    },

    async getStudentsForTeacher(teacherId: string) {
        const enrollments = await prisma.enrollment.findMany({
            where: {
                course: { teacherId }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            distinct: ['userId'],
            orderBy: {
                user: {
                    name: 'asc'
                }
            }
        });

        return enrollments.map(e => e.user);
    },

    async getCourseGradesReport(courseId: string) {
        const course = await prisma.course.findUnique({
            where: { id: courseId },
        });

        if (!course) throw new Error("Course not found");

        // 2. Fetch Enrolled Students
        const enrollments = await prisma.enrollment.findMany({
            where: {
                courseId: courseId,
                status: 'APPROVED' // Only active students
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profile: {
                            select: {
                                identificacion: true,
                                nombres: true,
                                apellido: true,
                            }
                        }
                    }
                }
            },
            orderBy: {
                user: { name: 'asc' }
            }
        });

        // 3. Process Data
        const reportData = enrollments.map(enrollment => {
            const student = enrollment.user;
            const row: any = {
                'ID': student.profile?.identificacion || student.id.substring(0, 8),
                'Estudiante': student.profile?.nombres && student.profile?.apellido
                    ? `${student.profile.nombres} ${student.profile.apellido}`
                    : student.name,
                'Correo': student.email,
                'Nota Final': '0.0'
            };

            return row;
        });

        return reportData;
    },
    async getCourseAttendanceReport(courseId: string) {
        // 1. Fetch Course to ensure it exists
        const course = await prisma.course.findUnique({
            where: { id: courseId },
        });

        if (!course) throw new Error("Course not found");

        // 2. Fetch Enrolled Students
        const enrollments = await prisma.enrollment.findMany({
            where: {
                courseId: courseId,
                status: 'APPROVED' // Only active students
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profile: {
                            select: {
                                identificacion: true,
                                nombres: true,
                                apellido: true,
                            }
                        }
                    }
                }
            },
            orderBy: {
                user: { name: 'asc' }
            }
        });

        // 3. Process Data
        const reportData = enrollments.map(enrollment => {
            const student = enrollment.user;
            const row: any = {
                'ID': student.profile?.identificacion || student.id.substring(0, 8),
                'Estudiante': student.profile?.nombres && student.profile?.apellido
                    ? `${student.profile.nombres} ${student.profile.apellido}`
                    : student.name,
                'Correo': student.email
            };

            return row;
        });

        return reportData;
    },
};
