import Employee from "../models/Employee.js";

const DEFAULT_EMPLOYEES = [
  {
    name: "Nikhil Rao",
    email: "nikhil.rao@eximadvisory.com",
    phone: "+91 98765 43210",
    role: "Senior Trade Advisor",
    department: "DGFT Advisory",
    status: "Active",
  },
  {
    name: "Simran Kaur",
    email: "simran.kaur@eximadvisory.com",
    phone: "+91 98765 43211",
    role: "Sales Manager",
    department: "Sales",
    status: "Active",
  },
  {
    name: "Kabir Malhotra",
    email: "kabir.m@eximadvisory.com",
    phone: "+91 98765 43212",
    role: "Customs Compliance Specialist",
    department: "Customs",
    status: "Active",
  },
  {
    name: "Anjali Desai",
    email: "anjali.desai@eximadvisory.com",
    phone: "+91 98765 43213",
    role: "Key Account Executive",
    department: "Sales",
    status: "Active",
  },
  {
    name: "Rahul Verma",
    email: "rahul.verma@eximadvisory.com",
    phone: "+91 98765 43214",
    role: "Logistics Consultant",
    department: "Logistics",
    status: "Active",
  },
];

// @desc  Get all employees
// @route GET /api/employees
export const getEmployees = async (req, res, next) => {
  try {
    const { search, status, department } = req.query;
    const filter = {};

    // Auto seed default employees if collection is empty
    const count = await Employee.countDocuments();
    if (count === 0) {
      await Employee.insertMany(
        DEFAULT_EMPLOYEES.map((emp) => ({
          ...emp,
          createdByClerkId: req.user?.clerkId || "system",
        }))
      );
    }

    if (status && status !== "All") {
      filter.status = status;
    }

    if (department && department !== "All") {
      filter.department = department;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { role: { $regex: search, $options: "i" } },
        { department: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const employees = await Employee.find(filter).sort({ joinedDate: -1 });

    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees,
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Get single employee
// @route GET /api/employees/:id
export const getEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
};

// @desc  Create employee
// @route POST /api/employees
export const createEmployee = async (req, res, next) => {
  try {
    const { name, email, phone, role, department, status, joinedDate } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: "Name and email are required" });
    }

    const employee = await Employee.create({
      name,
      email,
      phone,
      role: role || "Trade Consultant",
      department: department || "Sales",
      status: status || "Active",
      joinedDate: joinedDate || Date.now(),
      createdByClerkId: req.user?.clerkId,
    });

    res.status(201).json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
};

// @desc  Update employee
// @route PUT /api/employees/:id
export const updateEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
};

// @desc  Delete employee
// @route DELETE /api/employees/:id
export const deleteEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    res.status(200).json({ success: true, message: "Employee deleted successfully" });
  } catch (error) {
    next(error);
  }
};
