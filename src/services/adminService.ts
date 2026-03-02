import prisma from "@/lib/prisma";


export const adminService = {
    // ============ DASHBOARD METRICS ============


    // ============ USER MANAGEMENT ============
    async getAllUsers(filters?: {
        role?: "teacher" | "student" | "admin";
        search?: string;
        courseId?: string;
        limit?: number;
        offset?: number;
    }) {
        const where: any = {};
        const andConditions: any[] = [];

        if (filters?.role) {
            where.role = filters.role;
        }

        if (filters?.courseId && filters.courseId !== 'all') {
            andConditions.push({
                OR: [
                    // Student enrolled in course
                    { enrollments: { some: { courseId: filters.courseId } } },
                    // Teacher who created the course
                    { coursesCreated: { some: { id: filters.courseId } } }
                ]
            });
        }

        if (filters?.search) {
            andConditions.push({
                OR: [
                    { name: { contains: filters.search, mode: 'insensitive' as const } },
                    { email: { contains: filters.search, mode: 'insensitive' as const } }
                ]
            });
        }

        if (andConditions.length > 0) {
            where.AND = andConditions;
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                take: filters?.limit || 50,
                skip: filters?.offset || 0,
                orderBy: { createdAt: 'desc' },
                include: {
                    profile: true,
                    _count: {
                        select: {
                            coursesCreated: true,
                            enrollments: true,
                            evaluationSubmissions: true
                        }
                    }
                }
            }),
            prisma.user.count({ where })
        ]);

        return { users, total };
    },

    async getUserDetails(userId: string) {
        return await prisma.user.findUnique({
            where: { id: userId },
            include: {
                profile: true,
                coursesCreated: {
                    include: {
                        _count: {
                            select: {
                                enrollments: true
                            }
                        }
                    }
                },
                enrollments: {
                    include: {
                        course: {
                            include: {
                                teacher: {
                                    select: {
                                        name: true,
                                        email: true
                                    }
                                }
                            }
                        }
                    }
                },
                evaluationSubmissions: {
                    include: {
                        attempt: {
                            include: {
                                evaluation: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10
                },
                remarks: {
                    include: {
                        course: true,
                        teacher: true
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
    },

    async updateUserRole(userId: string, newRole: "teacher" | "student" | "admin") {
        return await prisma.user.update({
            where: { id: userId },
            data: { role: newRole }
        });
    },

    async toggleUserBan(userId: string, banned: boolean) {
        return await prisma.user.update({
            where: { id: userId },
            data: { banned }
        });
    },

    async deleteUser(userId: string) {
        // This will cascade delete related records based on schema
        return await prisma.user.delete({
            where: { id: userId }
        });
    },

    // ============ COURSE MANAGEMENT ============
    async getAllCoursesAdmin(filters?: {
        status?: 'all';
        teacherId?: string;
        search?: string;
        limit?: number;
        offset?: number;
    }) {
        const where: any = {};
        const andConditions: any[] = [];


        if (filters?.teacherId) {
            where.teacherId = filters.teacherId;
        }

        if (filters?.search) {
            andConditions.push({
                OR: [
                    { title: { contains: filters.search, mode: 'insensitive' as const } },
                    { description: { contains: filters.search, mode: 'insensitive' as const } }
                ]
            });
        }

        if (andConditions.length > 0) {
            where.AND = andConditions;
        }

        const [courses, total] = await Promise.all([
            prisma.course.findMany({
                where,
                take: filters?.limit || 50,
                skip: filters?.offset || 0,
                orderBy: { createdAt: 'desc' },
                include: {
                    teacher: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    },
                    _count: {
                        select: {
                            enrollments: true
                        }
                    }
                }
            }),
            prisma.course.count({ where })
        ]);

        return { courses, total };
    },

    async getCourseDetailsAdmin(courseId: string) {
        return await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                teacher: true,
                enrollments: {
                    include: {
                        user: {
                            include: {
                                profile: true
                            }
                        }
                    }
                },
                remarks: {
                    include: {
                        user: true,
                        teacher: true
                    }
                }
            }
        });
    },

    async reassignCourseTeacher(courseId: string, newTeacherId: string) {
        return await prisma.course.update({
            where: { id: courseId },
            data: { teacherId: newTeacherId }
        });
    },



    async getAllCoursesSimple() {
        return await prisma.course.findMany({
            // Fetch all courses for filtering, regardless of date
            where: {},
            select: {
                id: true,
                title: true
            },
            orderBy: {
                title: 'asc'
            }
        });
    },

    // ============ NOTIFICATION MANAGEMENT ============


    // ============ SYSTEM STATISTICS ============


    // ============ AUDIT LOGS (Simple version) ============
    async getRecentEvaluationSubmissions(limit: number = 20) {
        // Get recent evaluation submissions as activity indicator
        const recentSubmissions = await prisma.evaluationSubmission.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                attempt: {
                    include: {
                        evaluation: {
                            select: {
                                title: true
                            }
                        },
                        course: {
                            select: {
                                title: true
                            }
                        }
                    }
                }
            }
        });

        return recentSubmissions.map(sub => ({
            type: 'submission',
            timestamp: sub.submittedAt || sub.createdAt,
            user: sub.user,
            details: {
                evaluation: sub.attempt.evaluation.title,
                course: sub.attempt.course?.title || "N/A",
                score: sub.score
            }
        }));
    },
    // ============ SYSTEM SETTINGS ============
    async getPublicSettings() {
        return await prisma.systemSettings.findUnique({
            where: { id: "settings" },
            select: {
                appTitle: true,
                allowUserApiKeys: true
            }
        });
    }
};
