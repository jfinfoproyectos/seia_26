"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { adminService } from "@/services/adminService";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

async function getSession() {
    return await auth.api.getSession({ headers: await headers() });
}

// Middleware to check admin role
async function requireAdmin() {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
    }
    return session;
}

// ============ DASHBOARD ============



// ============ USER MANAGEMENT ============
export async function getAllUsersAction(filters?: {
    role?: "teacher" | "student" | "admin";
    search?: string;
    courseId?: string;
    limit?: number;
    offset?: number;
}) {
    await requireAdmin();
    return await adminService.getAllUsers(filters);
}

export async function getAllCoursesForFilterAction() {
    await requireAdmin();
    return await adminService.getAllCoursesSimple();
}

export async function createUserAction(data: {
    email: string;
    name: string;
    role: "teacher" | "admin";
    password: string;
}) {
    await requireAdmin();


    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
    });

    if (existingUser) {
        throw new Error("Ya existe un usuario con este correo electrónico");
    }

    // Hash password
    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user with account
    const user = await prisma.user.create({
        data: {
            id: crypto.randomUUID(),
            email: data.email,
            name: data.name,
            role: data.role,
            emailVerified: true,
            accounts: {
                create: {
                    id: crypto.randomUUID(),
                    accountId: crypto.randomUUID(),
                    providerId: "credential",
                    password: hashedPassword,
                }
            }
        }
    });

    revalidatePath("/dashboard/admin/users");
    return user;
}

export async function getUserDetailsAction(userId: string) {
    await requireAdmin();
    return await adminService.getUserDetails(userId);
}


export async function updateUserRoleAction(userId: string, newRole: "teacher" | "student" | "admin") {
    const session = await requireAdmin();

    // Get user info before update
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true, role: true }
    });

    const result = await adminService.updateUserRole(userId, newRole);

    revalidatePath("/dashboard/admin/users");
    return result;
}


export async function toggleUserBanAction(userId: string, banned: boolean) {
    const session = await requireAdmin();

    // Get user info before update
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true }
    });

    const result = await adminService.toggleUserBan(userId, banned);

    revalidatePath("/dashboard/admin/users");
    return result;
}



export async function deleteUserAction(userId: string) {
    const session = await requireAdmin();

    // Get user info before deletion
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true, role: true }
    });

    const result = await adminService.deleteUser(userId);

    revalidatePath("/dashboard/admin/users");
    return result;
}


// ============ COURSE MANAGEMENT ============
export async function getAllCoursesAdminAction(filters?: {
    teacherId?: string;
    search?: string;
    limit?: number;
    offset?: number;
}) {
    await requireAdmin();
    return await adminService.getAllCoursesAdmin(filters);
}

export async function getCourseDetailsAdminAction(courseId: string) {
    await requireAdmin();
    return await adminService.getCourseDetailsAdmin(courseId);
}


export async function reassignCourseTeacherAction(courseId: string, newTeacherId: string) {
    const session = await requireAdmin();

    // Get course and teacher info
    const [course, oldTeacher, newTeacher] = await Promise.all([
        prisma.course.findUnique({ where: { id: courseId }, select: { title: true, teacherId: true } }),
        prisma.user.findUnique({ where: { id: newTeacherId }, select: { name: true } }),
        prisma.user.findUnique({ where: { id: newTeacherId }, select: { name: true } })
    ]);

    const result = await adminService.reassignCourseTeacher(courseId, newTeacherId);

    revalidatePath("/dashboard/admin/courses");
    revalidatePath(`/dashboard/admin/courses/${courseId}`);
    return result;
}




// ============ NOTIFICATION MANAGEMENT ============


// ============ BULK OPERATIONS ============

export async function bulkDeleteUsersAction(userIds: string[]) {
    await requireAdmin();

    const results = await Promise.all(
        userIds.map(id => adminService.deleteUser(id))
    );

    revalidatePath("/dashboard/admin/users");
    return results;
}

export async function deleteCourseAction(courseId: string) {
    const session = await requireAdmin();
    const { courseService } = await import("@/services/courseService");

    // Get course info first for logging
    const course = await courseService.getCourseById(courseId);

    // Delete course
    await courseService.deleteCourse(courseId);

    revalidatePath("/dashboard/admin/courses");
    return { success: true };
}

export async function getPublicSettingsAction() {
    return await adminService.getPublicSettings();
}
