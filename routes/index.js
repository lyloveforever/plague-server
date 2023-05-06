import express from 'express'
const router = express.Router({})

import conn from './../db/db'
import config from '../src/config'
import sms_util from './../util/sms_util'
const alipaySdk = require('./../util/alipayutil');
const AlipayFormData = require('alipay-sdk/lib/form').default; // alipay.trade.page.pay 返回的内容为 Form 表单

import svgCaptcha from 'svg-captcha'
import md5 from 'blueimp-md5'
import formidable from 'formidable'
import {
    basename
} from 'path'
import {
    error,
    timeStamp
} from 'console'
import { nextTick, title } from 'process'
const jwt = require("jsonwebtoken")

const users = {}; // 用户信息
let tmp_captcha = '';
const TOKEN_KEY = 'TOKEN' //TOKEN密钥
const TIME = 60 * 60 * 24 //过期时间


/** 
 * Web端登录 
 * */
router.post('/api/login', (req, res) => {
    const name = req.body.name;
    const password = md5(md5(req.body.password));
    let sqlStr = "SELECT * FROM administratorcount WHERE name= '" + name + "'"
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            res.json({
                error_code: 0,
                message: '不存在该用户',
            });
        } else {
            let sqlStr2 = "SELECT * FROM administratorcount  WHERE name = ? and password = ?"
            let params = [name, password]
            conn.query(sqlStr2, params, (err, results, fields) => {
                if (err) {
                    res.json({
                        error_code: 0,
                        message: '密码错误',
                        err: err
                    });
                } else {
                    results = JSON.parse(JSON.stringify(results));
                    let token = jwt.sign({ name }, TOKEN_KEY, { expiresIn: TIME })
                    res.json({
                        success_code: 200,
                        message: '登录成功！',
                        results: {
                            id: results[0].id,
                            eMail: results[0].eMail,
                            grade: results[0].grade,
                            name: results[0].name,
                            phoneNumber: results[0].phoneNumber
                        },
                        token: token
                    });
                }
            })
        }
    })
})



/**
 * 学生/教师管理删除单条学生/教师信息
 */
router.post('/api/manage/delete', (req, res) => {
    const id = req.body.id;
    let sqlStr = "DELETE FROM user WHERE id=" + id;
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            res.json({
                error_code: 0,
                message: '删除失败'
            })
        } else {
            res.json({
                success_code: 200,
                message: '删除成功',
            })
        }
    })
})

/**
 * 学生/教师管理新增单条学生信息
 */
router.post('/api/manage/add', (req, res) => {
    const userNumber = req.body.userNumber;
    const department = req.body.department;
    const userName = req.body.userName;
    const address = req.body.address;
    const inschool = req.body.inschool;
    const sex = req.body.sex;
    const age = req.body.age;
    const entryDate = req.body.entryDate;
    const recentTime = req.body.recentTime;
    const office = req.body.office;
    const identityType = req.body.identityType;
    let add_sql = "INSERT INTO user(userNumber, department, userName, address, inschool, sex, age, entryDate,recentTime,office,identityType) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?,?)";
    let sql_params = [userNumber, department, userName, address, inschool, sex, age, entryDate, recentTime, office, identityType];
    conn.query(add_sql, sql_params, (error, results, fields) => {
        if (error) {
            res.json({
                error_code: 0,
                message: '新增失败'
            });
        } else {
            res.json({
                success_code: 200,
                message: '新增成功'
            })
        }
    })

})

/**
 * 学生/教师管理修改某条学生信息
 */
router.post('/api/manage/update', (req, res) => {
    let id = req.body.id;
    const userNumber = req.body.userNumber;
    const department = req.body.department;
    const userName = req.body.userName;
    const address = req.body.address;
    const inschool = req.body.inschool;
    const sex = req.body.sex;
    const age = req.body.age;
    const entryDate = req.body.entryDate;
    const recentTime = req.body.recentTime;
    const office = req.body.office;
    let update_sql = "UPDATE user SET userNumber = ? ,department = ? , userName = ? ,address = ? , inschool = ? ,sex = ? ,age = ?,entryDate = ?,recentTime = ? ,office = ? WHERE id =" + id;
    let strParams = [userNumber, department, userName, address, inschool, sex, age, entryDate, recentTime, office];
    let exc_sql = "SELECT userNumber , department ,inschool FROM user WHERE id=" + id
    nextTick(async () => {
        await conn.query(exc_sql, (error, results, fields) => {
            if (!error) {
                let arr = JSON.parse(JSON.stringify(results))
                let change_sql = "UPDATE exception set userNumber = ? , department = ? where userNumber =" + arr[0].userNumber;
                let Params = [userNumber, department]
                conn.query(change_sql, Params, (error, results, fields) => { })
            }
        })
        await conn.query(update_sql, strParams, (error, results, fields) => {
            if (error) {
                res.json({
                    error_code: 0,
                    message: '修改失败',
                    error: error
                });
            } else {
                res.json({
                    success_code: 200,
                    message: '修改成功',
                })
            }
        })
    })
})

/**
 * 学生/教师管理信息查询
 */
router.post('/api/manage/all', (req, res) => {
    let identityType = req.body.identityType;
    let userNumber = req.body.userNumber;
    const page = req.body.page;
    const size = req.body.size;
    let sqlStr = '';
    if (userNumber) {
        sqlStr = "SELECT * FROM user WHERE identityType = " + identityType + " and userNumber like '%" + userNumber + "%'";
    } else {
        sqlStr = "SELECT * FROM user WHERE identityType =" + identityType
    }
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            res.json({
                error_code: 0,
                message: '失败',
                error: error
            });
        } else {
            let arr = JSON.parse(JSON.stringify(results))
            let brr = []
            for (let i = (page - 1) * size; i < page * size; i++) {
                if (arr[i]) {
                    brr.push(arr[i])
                }
            }
            results = JSON.parse(JSON.stringify(brr));
            res.json({
                success_code: 200,
                message: results,
                size: arr.length
            })
        }
    })
})

/**
 * 公告新增
 */
router.post('/api/proclamation/add', (req, res) => {
    const title = req.body.title;
    const content = req.body.content;
    const releaseDate = req.body.releaseDate;
    const releasePeople = req.body.releasePeople;
    const releaseState = 0;
    const remarks = req.body.remarks;
    let procl_add = "INSERT INTO notice (title, content, releaseDate, releasePeople, releaseState,  remarks) VALUES (?,?,?,?,?,?)";
    let strParams = [title, content, releaseDate, releasePeople, releaseState, remarks];
    conn.query(procl_add, strParams, (error, results, fields) => {
        if (error) {
            res.json({
                err_code: 0,
                massage: '新增失败',
                error: error,
            });
        } else {
            res.json({
                success_code: 200,
                message: '新增成功',
            })
        }
    })
})

/**
 * 公告删除
 */
router.post('/api/proclamation/delete', (req, res) => {
    const id = req.body.id;
    let sqlStr = "DELETE FROM notice WHERE id= " + id;
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            res.json({
                error_code: 0,
                message: '删除失败',
                error: error,
            });
        } else {
            res.json({
                success_code: 200,
                message: '删除成功',
            })
        }
    })
})

/**
 * 公告编辑修改
 */
router.post('/api/proclamation/update', (req, res) => {
    let id = req.body.id;
    const title = req.body.title;
    const content = req.body.content;
    const releaseDate = req.body.releaseDate;
    const releasePeople = req.body.releasePeople;
    const remarks = req.body.remarks;
    let procl_update = "UPDATE notice SET title = ? ,content = ? , releaseDate = ? ,releasePeople = ? ,remarks = ? WHERE id=" + id;
    let strParams = [title, content, releaseDate, releasePeople, remarks];
    conn.query(procl_update, strParams, (error, results, fields) => {
        if (error) {
            res.json({
                err_code: 0,
                massage: '修改失败',
                error: error,
            });
        } else {
            res.json({
                success_code: 200,
                message: '修改成功',
            })
        }
    })
})

/**
 * 公告页面信息查询
 */
router.post('/api/proclamation/all', (req, res) => {
    const title = req.body.title;
    const page = req.body.page;
    const size = req.body.size;
    let sqlStr;
    if (!title) {
        sqlStr = "SELECT * FROM notice ";

    } else {
        sqlStr = "SELECT * FROM notice WHERE title like '%" + title + "%'";
    }
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            res.json({
                error_code: 0,
                message: '失败',
            });
        } else {
            let arr = JSON.parse(JSON.stringify(results))
            let brr = []
            for (let i = (page - 1) * size; i < page * size; i++) {
                if (arr[i]) {
                    brr.push(arr[i])
                }
            }
            results = JSON.parse(JSON.stringify(brr));
            res.json({
                success_code: 200,
                message: results,
                size: arr.length
            })
        }
    })
})


/**
 * 公告发布与撤回
 */
router.post('/api/proclamation/status', (req, res) => {
    const id = req.body.id;
    const releaseState = req.body.releaseState;
    const releaseDate = req.body.releaseDate
    let status_sql = "UPDATE notice SET releaseState = ?, releaseDate = ? WHERE id = " + id;
    let strParams = [releaseState,releaseDate];
    conn.query(status_sql, strParams, (error, results, fields) => {
        if (error) {
            res.json({
                err_code: 0,
                message: '失败'
            });
        } else {
            res.json({
                success_code: 200,
                message: '成功'
            })
        }
    })

})

/**
 * 请假页面信息查询
 */
router.post('/api/apply/all', (req, res) => {
    const userNumber = req.body.userNumber;
    const page = req.body.page;
    const size = req.body.size;
    let approvalStatus = req.body.approvalStatus !== undefined ? (req.body.approvalStatus + 1) : undefined;
    let inschool = req.body.inschool !== undefined ? (req.body.inschool + 1) : undefined;
    let date = req.body.date !==undefined ? req.body.date:undefined;
    let sqlStr;
    if (!inschool) {
        if (!userNumber) {
            if (!approvalStatus) {
                sqlStr = "SELECT * FROM leaveinfo ";
            } else {
                sqlStr = "SELECT * FROM leaveinfo WHERE approvalStatus=" + (approvalStatus - 1);
            }
        } else {
            if (!approvalStatus) {
                sqlStr = "SELECT * FROM leaveinfo WHERE userNumber like '%" + userNumber + "%'"
            } else {
                sqlStr = "SELECT * FROM leaveinfo WHERE approvalStatus =" + (approvalStatus - 1) + " and userNumber like '%" + userNumber + "%'";
            }
        }
    } else {
        if (!userNumber) {
            if (!approvalStatus) {
                sqlStr = "SELECT * FROM leaveinfo WHERE inschool =" + (inschool - 1)
            } else {
                sqlStr = "SELECT * FROM leaveinfo WHERE inschool =" + (inschool - 1) + " and approvalStatus =" + (approvalStatus - 1);
            }
        } else {
            if (!approvalStatus) {
                sqlStr = "SELECT * FROM leaveinfo WHERE userNumber=" + userNumber + " and inschool =" + (inschool - 1);
            }
        }
    }
    if(date){
        sqlStr += "and applyDate = " + date
    }
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            res.json({
                error_code: 0,
                message: '失败',
                error: error,
            });
        } else {
            let arr = JSON.parse(JSON.stringify(results))
            let brr = []
            for (let i = (page - 1) * size; i < page * size; i++) {
                if (arr[i]) {
                    brr.push(arr[i])
                }
            }
            results = JSON.parse(JSON.stringify(brr));
            res.json({
                success_code: 200,
                message: results,
                size: arr.length
            })
        }
    })
})

/**
 * 请假审批与销假
 */
router.post('/api/apply/approve', (req, res) => {
    const id = req.body.id;
    const userNumber = req.body.userNumber;
    const approvalOpinion = req.body.approvalOpinion;
    const approvalStatus = req.body.approvalStatus;
    const inschool = req.body.inschool;
    const approvalDate = req.body.approvalDate;
    let sqlStr = "UPDATE leaveinfo SET approvalOpinion = ? ,approvalStatus = ? ,inschool = ? ,approvalDate = ? WHERE userNumber='" + userNumber + "' and id =" +id;
    let sqlStr2 = 'UPDATE user SET inschool = ? WHERE userNumber=' + userNumber;
    let strParams = [approvalOpinion, approvalStatus, inschool,approvalDate];
    let strParams2 = [inschool];
    conn.query(sqlStr2, strParams2, (error, results, fields) => { })
    conn.query(sqlStr, strParams, (error, results, fields) => {
        if (error) {
            res.json({
                error_code: 0,
                error:error,
                message: '失败',
            });
        } else {
            results = JSON.parse(JSON.stringify(results));
            res.json({
                success_code: 200,
                message: '成功'
            })
        }
    })
})


/**
 * 打卡管理信息查询
 */
router.post('/api/clock/all', (req, res) => {
    const page = req.body.page;
    const size = req.body.size;
    const date = req.body.date;
    let sqlStr = '';
    if (!date) {
        sqlStr = "SELECT * FROM clock";
    } else {
        sqlStr = "SELECT * FROM clock WHERE date like '%" + date + "%'"
    }
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            res.json({
                error_code: 0,
                message: '失败',
                error: error
            });
        } else {
            let arr = JSON.parse(JSON.stringify(results))
            let brr = []
            for (let i = (page - 1) * size; i < page * size; i++) {
                if (arr[i]) {
                    brr.push(arr[i])
                }
            }
            results = JSON.parse(JSON.stringify(brr));
            res.json({
                success_code: 200,
                message: results,
                size: arr.length
            })
        }
    })
})


/**
 * 防控管理新增
 */
router.post('/api/prevent/add', (req, res) => {
    const type = req.body.type;
    const address = req.body.address;
    const time = req.body.time;
    const manager = req.body.manager;
    const materialSituation = req.body.materialSituation;
    let procl_add = "INSERT INTO preventinfo (type, address, time, manager, materialSituation) VALUES (?,?,?,?,?)";
    let strParams = [type, address, time, manager, materialSituation];
    conn.query(procl_add, strParams, (error, results, fields) => {
        if (error) {
            res.json({
                err_code: 0,
                massage: '新增失败',
                error: error,
            });
        } else {
            res.json({
                success_code: 200,
                message: '新增成功',
            })
        }
    })
})
/**
 * 防控管理删除
 */
router.post('/api/prevent/delete', (req, res) => {
    const id = req.body.id;
    let sqlStr = "DELETE FROM preventinfo WHERE id= " + id;
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            res.json({
                error_code: 0,
                message: '删除失败',
                error: error,
            });
        } else {
            res.json({
                success_code: 200,
                message: '删除成功',
            })
        }
    })
})

/**
 * 防控管理修改
 */
router.post('/api/prevent/update', (req, res) => {
    const id = req.body.id;
    const type = req.body.type;
    const address = req.body.address;
    const time = req.body.time;
    const manager = req.body.manager;
    const materialSituation = req.body.materialSituation;
    let procl_update = "UPDATE preventinfo SET type = ? ,address = ? , time = ? ,manager = ? , materialSituation = ? WHERE id=" + id;
    let strParams = [type, address, time, manager, materialSituation];
    conn.query(procl_update, strParams, (error, results, fields) => {
        if (error) {
            res.json({
                err_code: 0,
                massage: '修改失败',
                error: error,
            });
        } else {
            res.json({
                success_code: 200,
                message: '修改成功',
            })
        }
    })
})

/**
 * 防控管理信息查询
 */
router.post('/api/prevent/all', (req, res) => {
    const time = req.body.time;
    const page = req.body.page;
    const size = req.body.size;
    let type = req.body.type !== undefined ? (req.body.type + 1) : undefined;
    let sqlStr;
    if (!type && !time) {
        sqlStr = "SELECT * FROM preventinfo";
    } else if (!time) {
        sqlStr = "SELECT * FROM preventinfo WHERE type=" + (type - 1);
    } else if (!type) {
        sqlStr = "SELECT * FROM preventinfo WHERE time=" + time;
    } else {
        sqlStr = "SELECT * FROM preventinfo WHERE type=" + (type - 1) + " and time=" + time;
    }
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            res.json({
                error_code: 0,
                message: '搜索失败',
                error: error,
            });
        } else {
            let arr = JSON.parse(JSON.stringify(results))
            let brr = []
            for (let i = (page - 1) * size; i < page * size; i++) {
                if (arr[i]) {
                    brr.push(arr[i])
                }
            }
            results = JSON.parse(JSON.stringify(brr));
            res.json({
                success_code: 200,
                message: results,
                size: arr.length
            })
        }
    })
})


/**
 * 异常管理增加
 */
router.post('/api/exception/add', (req, res) => {
    const status = req.body.status;
    const department = req.body.department;
    const userNumber = req.body.userNumber;
    const startTime = req.body.startTime;
    const phoneNumber = req.body.phoneNumber;
    const remarks = req.body.remarks;
    let except_add = "INSERT INTO exception (status, department, userNumber, startTime, phoneNumber,remarks) VALUES (?,?,?,?,?,?)";
    let strParams = [status, department, userNumber, startTime, phoneNumber, remarks];
    conn.query(except_add, strParams, (error, results, fields) => {
        if (error) {
            res.json({
                err_code: 0,
                massage: '新增失败',
                error: error,
            });
        } else {
            res.json({
                success_code: 200,
                message: '新增成功',
            })
        }
    })
})
/**
 * 异常管理删除
 */
router.post('/api/exception/delete', (req, res) => {
    const id = req.body.id;
    let sqlStr = "DELETE FROM exception WHERE id= " + id;
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            res.json({
                error_code: 0,
                message: '删除失败',
                error: error,
            });
        } else {
            res.json({
                success_code: 200,
                message: '删除成功',
            })
        }
    })
})

/**
 * 异常管理修改
 */
router.post('/api/exception/update', (req, res) => {
    const id = req.body.id;
    const status = req.body.status;
    const department = req.body.department;
    const userNumber = req.body.userNumber;
    const startTime = req.body.startTime;
    const phoneNumber = req.body.phoneNumber;
    const remarks = req.body.remarks;
    let except_add = "UPDATE exception SET status = ? ,department = ? ,userNumber = ? ,startTime = ? ,phoneNumber = ? ,remarks = ? WHERE id=" + id;
    let strParams = [status, department, userNumber, startTime, phoneNumber, remarks];
    conn.query(except_add, strParams, (error, results, fields) => {
        if (error) {
            res.json({
                err_code: 0,
                massage: '修改失败',
                error: error,
            });
        } else {
            res.json({
                success_code: 200,
                message: '修改成功',
            })
        }
    })
})

/**
 * 异常管理信息查询
 */
router.post('/api/exception/search', (req, res) => {
    const userNumber = req.body.userNumber;
    const page = req.body.page;
    const size = req.body.size;
    let status = req.body.status !== undefined ? (req.body.status + 1) : undefined;
    let sqlStr;
    if (!userNumber && !status) {
        sqlStr = "SELECT * FROM exception ";
    } else if (!status) {
        sqlStr = "SELECT * FROM exception WHERE userNumber like '%" + userNumber + "%'";
    } else if (!userNumber) {
        sqlStr = "SELECT * FROM exception WHERE status=" + (status - 1);
    }
    else {
        sqlStr = "SELECT * FROM exception WHERE userNumber='" + userNumber + "' and status=" + (status - 1);
    }
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            res.json({
                error_code: 0,
                message: '搜索失败',
                error: error,
            });
        } else {
            let arr = JSON.parse(JSON.stringify(results))
            let brr = []
            for (let i = (page - 1) * size; i < page * size; i++) {
                if (arr[i]) {
                    brr.push(arr[i])
                }
            }
            results = JSON.parse(JSON.stringify(brr));
            res.json({
                success_code: 200,
                message: results,
                size: arr.length
            })
        }
    })
})



/**
 * 疾病管理增加
 */
router.post('/api/disease/add', (req, res) => {
    const diseaseName = req.body.diseaseName;
    const symptom = req.body.symptom;
    const diagnosticWay = req.body.diagnosticWay;
    const infectionWay = req.body.infectionWay;
    const deaths = req.body.deaths;
    const treatmentMeans = req.body.treatmentMeans;
    const earliestTime = req.body.earliestTime;
    let disease_add = "INSERT INTO disease (diseaseName, symptom, diagnosticWay, infectionWay, deaths, treatmentMeans, earliestTime) VALUES (?,?,?,?,?,?,?)";
    let strParams = [diseaseName, symptom, diagnosticWay, infectionWay, deaths, treatmentMeans, earliestTime];
    conn.query(disease_add, strParams, (error, results, fields) => {
        if (error) {
            res.json({
                err_code: 0,
                massage: '新增失败',
                error: error,
            });
        } else {
            res.json({
                success_code: 200,
                message: '新增成功',
            })
        }
    })
})
/**
 * 疾病管理删除
 */
router.post('/api/disease/delete', (req, res) => {
    const id = req.body.id;
    let sqlStr = "DELETE FROM disease WHERE id= " + id;
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            res.json({
                error_code: 0,
                message: '删除失败',
                error: error,
            });
        } else {
            res.json({
                success_code: 200,
                message: '删除成功',
            })
        }
    })
})

/**
 * 疾病管理修改
 */
router.post('/api/disease/update', (req, res) => {
    const id = req.body.id;
    const diseaseName = req.body.diseaseName;
    const symptom = req.body.symptom;
    const diagnosticWay = req.body.diagnosticWay;
    const infectionWay = req.body.infectionWay;
    const deaths = req.body.deaths;
    const treatmentMeans = req.body.treatmentMeans;
    const earliestTime = req.body.earliestTime;
    let disease_add = "UPDATE disease SET diseaseName = ? ,symptom = ? ,diagnosticWay = ? ,infectionWay = ? ,deaths = ? ,treatmentMeans = ? ,earliestTime =? WHERE id=" + id;
    let strParams = [diseaseName, symptom, diagnosticWay, infectionWay, deaths, treatmentMeans, earliestTime];
    conn.query(disease_add, strParams, (error, results, fields) => {
        if (error) {
            res.json({
                err_code: 0,
                massage: '修改失败',
                error: error,
            });
        } else {
            res.json({
                success_code: 200,
                message: '修改成功',
            })
        }
    })
})

/**
 * 疾病管理信息搜索
 */
router.post('/api/disease/search', (req, res) => {
    const diseaseName = req.body.diseaseName;
    const page = req.body.page;
    const size = req.body.size;
    let sqlStr = '';
    if (!diseaseName) {
        sqlStr = "SELECT * FROM disease ";
    } else {
        sqlStr = "SELECT * FROM disease WHERE diseaseName like '%" + diseaseName + "%'";
    }
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            res.json({
                error_code: 0,
                message: '搜索失败',
                error: error,
            });
        } else {
            let arr = JSON.parse(JSON.stringify(results))
            let brr = []
            for (let i = (page - 1) * size; i < page * size; i++) {
                if (arr[i]) {
                    brr.push(arr[i])
                }
            }
            results = JSON.parse(JSON.stringify(brr));
            res.json({
                success_code: 200,
                message: results,
                size: arr.length
            })
        }
    })
})

/**
 * 账号管理增加
 */
router.post('/api/administratorcount/add', (req, res) => {
    const name = req.body.name;
    const phoneNumber = req.body.phoneNumber;
    const eMail = req.body.eMail;
    const password = md5(md5(req.body.password));
    const grade = req.body.grade;
    let admin_add = "INSERT INTO administratorcount (name, phoneNumber, eMail, password, grade) VALUES (?,?,?,?,?)";
    let strParams = [name, phoneNumber, eMail, password, grade];
    conn.query(admin_add, strParams, (error, results, fields) => {
        if (error) {
            res.json({
                err_code: 0,
                massage: '新增失败',
                error: error,
            });
        } else {
            res.json({
                success_code: 200,
                message: '新增成功',
            })
        }
    })
})

/**
 * 账号管理删除
 */
router.post('/api/administratorcount/delete', (req, res) => {
    const id = req.body.id;
    let sqlStr = "DELETE FROM administratorcount WHERE id= " + id;
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            res.json({
                error_code: 0,
                message: '删除失败',
                error: error,
            });
        } else {
            res.json({
                success_code: 200,
                message: '删除成功',
            })
        }
    })
})

/**
 * 账号管理修改
 */
router.post('/api/administratorcount/update', (req, res) => {
    const id = req.body.id;
    const name = req.body.name;
    const phoneNumber = req.body.phoneNumber;
    const eMail = req.body.eMail;
    const password = md5(md5(req.body.password));
    const grade = req.body.grade;
    let admin_add = "UPDATE administratorcount SET name = ? ,phoneNumber = ? ,eMail = ? ,password = ? ,grade = ? WHERE id=" + id;
    let strParams = [name, phoneNumber, eMail, password, grade];
    conn.query(admin_add, strParams, (error, results, fields) => {
        if (error) {
            res.json({
                err_code: 0,
                massage: '修改失败',
                error: error,
            });
        } else {
            res.json({
                success_code: 200,
                message: '修改成功',
            })
        }
    })
})

/**
 * 账号管理信息查询
 */
router.post('/api/administratorcount/search', (req, res) => {
    const name = req.body.name;
    const page = req.body.page;
    const size = req.body.size;
    let sqlStr = '';
    if (!name) {
        sqlStr = "SELECT * FROM administratorcount ";
    } else {
        sqlStr = "SELECT * FROM administratorcount WHERE name like '%" + name + "%'";
    }
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            res.json({
                error_code: 0,
                message: '搜索失败',
                error: error,
            });
        } else {
            let arr = JSON.parse(JSON.stringify(results))
            let brr = []
            for (let i = (page - 1) * size; i < page * size; i++) {
                if (arr[i]) {
                    brr.push(arr[i])
                }
            }
            results = JSON.parse(JSON.stringify(brr));
            res.json({
                success_code: 200,
                message: results,
                size: arr.length
            })
        }
    })
})


/**
 * 地址管理增加
 */
router.post('/api/address/add', (req, res) => {
    const addressName = req.body.addressName;
    const addressId = req.body.addressId;
    const addressType = req.body.addressType;
    const detailAddress = req.body.detailAddress;
    let address_add = "INSERT INTO address (addressName, addressId,addressType, detailAddress) VALUES (?,?,?,?)";
    let strParams = [addressName, addressId, addressType, detailAddress];
    conn.query(address_add, strParams, (error, results, fields) => {
        if (error) {
            res.json({
                err_code: 0,
                massage: '新增失败',
                error: error,
            });
        } else {
            res.json({
                success_code: 200,
                message: '新增成功',
            })
        }
    })
})
/**
 * 地址管理删除
 */
router.post('/api/address/delete', (req, res) => {
    const id = req.body.id;
    let sqlStr = "DELETE FROM address WHERE id= " + id;
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            res.json({
                error_code: 0,
                message: '删除失败',
                error: error,
            });
        } else {
            res.json({
                success_code: 200,
                message: '删除成功',
            })
        }
    })
})

/**
 * 地址管理修改
 */
router.post('/api/address/update', (req, res) => {
    const id = req.body.id;
    const addressName = req.body.addressName;
    const addressId = req.body.addressId;
    const addressType = req.body.addressType;
    const detailAddress = req.body.detailAddress;
    let address_add = "UPDATE address SET addressName = ? ,addressId = ? ,addressType = ? ,detailAddress = ? WHERE id=" + id;
    let strParams = [addressName, addressId, addressType, detailAddress];
    conn.query(address_add, strParams, (error, results, fields) => {
        if (error) {
            res.json({
                err_code: 0,
                massage: '修改失败',
                error: error,
            });
        } else {
            res.json({
                success_code: 200,
                message: '修改成功',
            })
        }
    })
})

/**
 * 地址管理搜索
 */
router.post('/api/address/search', (req, res) => {
    const addressId = req.body.addressId;
    const page = req.body.page
    const size = req.body.size
    let sqlStr = '';
    if (!addressId) {
        sqlStr = "SELECT * FROM address";
    } else {
        sqlStr = "SELECT * FROM address WHERE addressId like '%" + addressId + "%'";
    }
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            res.json({
                error_code: 0,
                message: '搜索失败',
                error: error,
            });
        } else {
            let arr = JSON.parse(JSON.stringify(results))
            let brr = []
            for (let i = (page - 1) * size; i < page * size; i++) {
                if (arr[i]) {
                    brr.push(arr[i])
                }
            }
            results = JSON.parse(JSON.stringify(brr));
            res.json({
                success_code: 200,
                message: results,
                size: arr.length
            })
        }
    })
})

/**
 * 反馈管理删除
 */
router.post('/api/feedback/delete',(req,res)=>{
    const id = req.body.id;
    let sqlStr = "DELETE FROM feedback WHERE id= " + id;
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            res.json({
                error_code: 0,
                message: '删除失败',
                error: error,
            });
        } else {
            res.json({
                success_code: 200,
                message: '删除成功',
            })
        }
    })
    
})

/**
 * 反馈管理搜索
 */
router.post('/api/feedback/search', (req, res) => {
    const time = req.body.time;
    const page = req.body.page
    const size = req.body.size
    let sqlStr = '';
    if (!time) {
        sqlStr = "SELECT * FROM feedback";
    } else {
        sqlStr = "SELECT * FROM feedback WHERE time like '%" + time + "%'";
    }
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            res.json({
                error_code: 0,
                message: '搜索失败',
                error: error,
            });
        } else {
            let arr = JSON.parse(JSON.stringify(results))
            let brr = []
            for (let i = (page - 1) * size; i < page * size; i++) {
                if (arr[i]) {
                    brr.push(arr[i])
                }
            }
            results = JSON.parse(JSON.stringify(brr));
            res.json({
                success_code: 200,
                message: results,
                size: arr.length
            })
        }
    })
})


/**
 * 院校管理增加
 */
router.post('/api/academy/add', (req, res) => {
    const academyName = req.body.academyName;
    const principal = req.body.principal;
    const academyId = req.body.academyId;
    let academy_add = "INSERT INTO academy (academyName, principal,academyId) VALUES (?,?,?)";
    let strParams = [academyName, principal, academyId];
    conn.query(academy_add, strParams, (error, results, fields) => {
        if (error) {
            res.json({
                err_code: 0,
                massage: '新增失败',
                error: error,
            });
        } else {
            res.json({
                success_code: 200,
                message: '新增成功',
            })
        }
    })
})
/**
 * 院校管理删除
 */
router.post('/api/academy/delete', (req, res) => {
    const id = req.body.id;
    let sqlStr = "DELETE FROM academy WHERE id= " + id;
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            res.json({
                error_code: 0,
                message: '删除失败',
                error: error,
            });
        } else {
            res.json({
                success_code: 200,
                message: '删除成功',
            })
        }
    })
})

/**
 * 院校管理修改
 */
router.post('/api/academy/update', (req, res) => {
    const id = req.body.id;
    const academyName = req.body.academyName;
    const principal = req.body.principal;
    const academyId = req.body.academyId;
    let academy_add = "UPDATE academy SET academyName = ? ,principal = ? ,academyId = ? WHERE id=" + id;
    let strParams = [academyName, principal, academyId];
    conn.query(academy_add, strParams, (error, results, fields) => {
        if (error) {
            res.json({
                err_code: 0,
                massage: '修改失败',
                error: error,
            });
        } else {
            res.json({
                success_code: 200,
                message: '修改成功',
            })
        }
    })
})

/**
 * 院校管理信息查询
 */
router.post('/api/academy/search', (req, res) => {
    const academyId = req.body.academyId;
    const page = req.body.page
    const size = req.body.size
    let sqlStr = '';
    if (!academyId) {
        sqlStr = 'SELECT * FROM academy';
    } else {
        sqlStr = "SELECT * FROM academy WHERE academyId like '%" + academyId + "%'";
    }
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            res.json({
                error_code: 0,
                message: '搜索失败',
                error: error,
            });
        } else {
            let arr = JSON.parse(JSON.stringify(results))
            let brr = []
            for (let i = (page - 1) * size; i < page * size; i++) {
                if (arr[i]) {
                    brr.push(arr[i])
                }
            }
            results = JSON.parse(JSON.stringify(brr));
            res.json({
                success_code: 200,
                message: results,
                size: arr.length
            })
        }
    })
})



/**                                         *uniapp端                                       */


/**
 * 登录
 */
router.post('/api/uniLogin', (req, res) => {
    const userNumber = req.body.userNumber;
    const password = md5(md5(req.body.password));
    let sqlStr = "SELECT * FROM custom WHERE userNumber =" + userNumber;
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            res.json({
                error_code: 0,
                message: '不存在该用户,请先注册',
            });
        } else {
            let sqlStr2 = "SELECT * FROM custom  WHERE userNumber = ? and password = ?"
            let params = [userNumber, password]
            conn.query(sqlStr2, params, (err, results, fields) => {
                if (err) {
                    res.json({
                        error_code: 0,
                        message: '密码错误',
                        err: err
                    });
                } else {
                    results = JSON.parse(JSON.stringify(results));
                    let token = jwt.sign({ userNumber }, TOKEN_KEY, { expiresIn: TIME })
                    res.json({
                        success_code: 200,
                        message: '登录成功！',
                        results: {
                            userName: results[0].userName,
                            userNumber: results[0].userNumber,
                            phoneNumber: results[0].phoneNumber,
                            department: results[0].department,
                            sex: results[0].sex,
                            address: results[0].address,
                            age: results[0].age,
                        },
                        token: token
                    });
                }
            })
        }
    })
})


/**
 * 注册
 */
router.post('/api/uniRegist', (req, res) => {
    const userName = req.body.userName;
    const userNumber = req.body.userNumber;
    const sex = req.body.sex;
    const password = md5(md5(req.body.password));
    const age = req.body.age;
    const department = req.body.department;
    const phoneNumber = req.body.phoneNumber;
    const address = req.body.address;
    let sqlStr = "SELECT * FROM custom WHERE userNumber = '" + userNumber + "'";
    conn.query(sqlStr, (error, results, fields) => {
        if (results.length === 0) {
            let sqlStr2 = "SELECT * FROM user WHERE userNumber =" + userNumber;
            conn.query(sqlStr2, (err, results, fields) => {
                if (results.length === 0) {
                    res.json({
                        error_code: 0,
                        message: '您不是该校师生,不可注册'
                    })
                } else {
                    let addSql = "INSERT INTO custom (userName,userNumber,sex,password,age,department,phoneNumber,address) VALUES (?,?,?,?,?,?,?,?)"
                    let strParams = [userName, userNumber, sex, password, age, department, phoneNumber, address];
                    conn.query(addSql, strParams, (error, results, fields) => {
                        if (error) {
                            res.json({
                                error_code: 100,
                                error: error,
                                message: '注册失败'
                            })
                        } else {
                            res.json({
                                success_code: 200,
                                message: '注册成功'
                            })
                        }
                    })
                }
            })
        } else {
            res.json({
                error_code: 300,
                message: '该账号已存在'
            })
        }
    })
})

/**
 * 修改密码
 */
router.post('/api/uniPassword', (req, res) => {
    const userName = req.body.userName;
    const userNumber = req.body.userNumber;
    const phoneNumber = req.body.phoneNumber;
    const password = md5(md5(req.body.password))
    let sqlStr = "SELECT * FROM custom WHERE userName = ? and userNumber = ? and phoneNumber = ?"
    let strParams = [userName, userNumber, phoneNumber];
    conn.query(sqlStr, strParams, (error, results, fields) => {
        if (results.length === 0) {
            res.json({
                error_code: 0,
                message: '请再次核对信息'
            })
        } else {
            let sqlStr2 = "UPDATE custom set password = ? WHERE userNumber =" + userNumber
            let params = [password];
            conn.query(sqlStr2, params, (err, results, fields) => {
                if (err) {
                    res.json({
                        error_code: 100,
                        message: '修改失败'
                    })
                } else {
                    res.json({
                        success_code: 200,
                        message: '修改成功'
                    })
                    let sqlStr3 = "UPDATE user set password = ? WHERE userNumber =" + userNumber
                    conn.query(sqlStr3, params, (err, results, fields))
                    }
            })
        }
    })
})


/**
 * 请假审批历史展示
 */
router.post('/api/uniApply', (req, res) => {
    const userNumber = req.body.userNumber;
    let sqlStr = "SELECT * FROM leaveinfo WHERE userNumber =" + userNumber
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            res.json({
                error_code: 0,
                message: '失败'
            })
        } else {
            results = JSON.parse(JSON.stringify(results));
            res.json({
                success_code: 200,
                message: results
            })
        }
    })
})

/**
 * 请假审批增加
 */
router.post('/api/uniApply/add', (req, res) => {
    const applyDate = req.body.applyDate;
    const type = req.body.type;
    const userNumber = req.body.userNumber;
    const department = req.body.department;
    const leaveDate = req.body.leaveDate;
    const returnDate = req.body.returnDate;
    const transport = req.body.transport;
    const issue = req.body.issue;
    const approvalStatus = 0;
    const inschool = req.body.inschool;
    let sqlStr = " INSERT INTO leaveinfo (applyDate,type,userNumber,department,leaveDate,returnDate,transport,issue,approvalStatus,inschool) VALUES (?,?,?,?,?,?,?,?,?,?)"
    let strParams = [applyDate, type, userNumber, department, leaveDate, returnDate, transport, issue,approvalStatus,inschool];
    conn.query(sqlStr, strParams, (error, results, fields) => {
        if (error) {
            res.json({
                error_code: 0,
                message: '申请失败'
            })
        } else {
            if(type === 1){
                let sqlStr2 = "UPDATE user SET recentTime = ?"
                let strParams2 = [returnDate]
                conn.query(sqlStr2,strParams2,(error,results,fields))
            }
            res.json({
                success_code: 200,
                message: '申请成功'
            })
        }
    })

})


/**
 * 公告通知
 */
router.post('/api/uniapp/proclamation', (req, res) => {
    const page = req.body.page;
    const size = req.body.size;
    const releaseState =1;
    let sqlStr = "SELECT * FROM notice WHERE releaseState = " + releaseState;
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            res.json({
                error_code: 0,
                message: '失败',
            });
        } else {
            let arr = JSON.parse(JSON.stringify(results))
            let brr = []
            for (let i = (page - 1) * size; i < page * size; i++) {
                if (arr[i]) {
                    brr.push(arr[i])
                }
            }
            results = JSON.parse(JSON.stringify(brr));
            res.json({
                success_code: 200,
                message: results,
                size: arr.length
            })
        }
    })
})


/**
 * 打卡信息展示
 */
router.post('/api/uniClock', (req, res) => {
    const userNumber = req.body.userNumber
    let sqlStr = "SELECT * FROM checkinfo WHERE userNumber =" + userNumber
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            res.json({
                error_code: 0,
                message: '失败'
            })
        } else {
            results = JSON.parse(JSON.stringify(results));
            res.json({
                success_code: 200,
                message: results
            })
        }
    })
})


/**
 * 打卡增加
 */
router.post('/api/uniClock/add', (req, res) => {
    const userNumber = req.body.userNumber;
    const department = req.body.department;
    const phoneNumber = req.body.phoneNumber;
    const startTime = req.body.startTime;
    const checkTime = req.body.checkTime;
    const inschool = req.body.inschool;
    const address = req.body.address;
    const temperature = req.body.temperature;
    const symptom = req.body.symptom;
    const status = req.body.status;
    const name = req.body.name;
    let sqlStr = "INSERT INTO checkinfo (userNumber,department,inschool,address,temperature,symptom,status, name,checkTime) VALUES (?,?,?,?,?,?,?,?,?)";
    let strParams = [userNumber, department, inschool, address, temperature, symptom, status, name,checkTime];
    conn.query(sqlStr, strParams, (error, results, fields) => {
        if (!error) {
            if (status === 0 || status === 1) {
                let sqlStr2 = "INSERT INTO exception (userNumber,department,status,phoneNumber ,startTime) VALUES (?,?,?,?,?)"
                let params = [userNumber, department, status, phoneNumber, startTime];
                conn.query(sqlStr2, params, (error, results, fields))
            }
            res.json({
                success_code: 200,
                message: '打卡成功'
            })
        } else {
            res.json({
                error_code: 0,
                error:error,
                message: '打卡失败'
            })
        }
    })
})



/**
 * 反馈提交
 */
router.post('/api/unifeedback', (req, res) => {
    const title = req.body.title;
    const content = req.body.content;
    const time = req.body.time;
    let sqlStr = "INSERT INTO feedback (title,content,time) VALUES (?,?,?)"
    let strParams = [title, content,time];
    conn.query(sqlStr, strParams, (error, results, fields) => {
        if (error) {
            res.json({
                error_code: 0,
                error:error,
                message: '提交失败'
            })
        } else {
            res.json({
                success_code: 200,
                message: '提交成功'
            })
        }
    })

})

/**
 * 个人中心信息修改
 */

router.post('/api/uniGeren', (req, res) => {
    const userName = req.body.userName;
    const userNumber = req.body.userNumber;
    const phoneNumber = req.body.phoneNumber;
    const password = req.body.password;
    const sex = req.body.sex;
    const department = req.body.department;
    const address = req.body.address;
    const age = req.body.age;
    let sqlStr = "UPDATE custom SET userName = ? ,phoneNumber = ? , password = ? ,sex = ?, department = ? ,address =? , age = ? WHERE userNumber = " + userNumber
    let strParams = [userName, phoneNumber, password, sex, department, address, age];
    conn.query(sqlStr, strParams, (error, results, fields) => {
        if (!error) {
            res.json({
                success_code: 200,
                message: '修改成功'
            })
            let sqlStr2 = "UPDATE user SET userName = ? ,phoneNumber = ? , password = ? ,sex = ?, department = ? ,address =? , age = ? WHERE userNumber = " + userNumber
            conn.query(sqlStr2, strParams, (error, results, fields))
        } else {
            res.json({
                error_code: 0,
                message: '修改失败'
            })
        }
    })
})










/**
 一次性图形验证码
*/
router.get('/api/captcha', (req, res) => {
    // 生成随机验证码
    let captcha = svgCaptcha.create({
        color: true,
        noise: 3,
        ignoreChars: '0o1iIO',
        size: 4
    });

    // 保存
    req.session.captcha = captcha.text.toLocaleLowerCase();
    tmp_captcha = captcha.text.toLocaleLowerCase();

    // 返回客户端
    res.type('svg');
    res.send(captcha.data);
});

/**
  发送验证码短信
*/
router.get('/api/send_code', (req, res) => {
    // 获取手机号码
    let phone = req.query.phone;
    // 随机产生验证码
    let code = sms_util.randomCode(6);

    /* sms_util.sendCode(phone, code, function (success) {
        if (success) {
             users[phone] = code;
             res.json({success_code: 200, message: '验证码获取成功!'});
         } else {
             res.json({err_code: 0, message: '验证码获取失败!'});
         }
     });*/

    // 成功——模拟短信功能
    setTimeout(() => {
        users[phone] = code;
        res.json({
            success_code: 200,
            message: code
        });
    }, 2000);
});

/**
  手机验证码登录
*/
router.post('/api/login_code', (req, res) => {
    // 获取数据
    const phone = req.body.phone;
    const code = req.body.code;

    // 验证验证码是否正确
    if (users[phone] !== code) {
        res.json({
            err_code: 0,
            message: '验证码不正确!'
        });
    }

    // 查询数据
    delete users[phone];

    let sqlStr = "SELECT * FROM user_info WHERE user_phone = '" + phone + "' LIMIT 1";

    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            res.json({
                err_code: 0,
                message: '查询失败'
            });
            console.log(error);
        } else {
            results = JSON.parse(JSON.stringify(results));
            if (results[0]) { // 用户已经存在
                if (results[0].user_status == 0) {
                    res.json({
                        err_code: 301,
                        message: '用户已冻结!'
                    });
                } else {
                    req.session.userId = results[0].id;
                    res.json({
                        success_code: 200,
                        message: {
                            id: results[0].id,
                            user_name: results[0].user_name,
                            user_nickname: results[0].user_nickname || '',
                            user_phone: results[0].user_phone,
                            user_sex: results[0].user_sex,
                            user_address: results[0].user_address,
                            user_sign: results[0].user_sign,
                            user_birthday: results[0].user_birthday,
                            user_avatar: results[0].user_avatar
                        }
                    });
                }
            } else { // 新用户
                const addSql = "INSERT INTO user_info(user_name, user_phone, user_avatar) VALUES (?, ?, ?)";
                const addSqlParams = [phone, phone, 'http://localhost:' + config.port + '/avatar_uploads/avatar_default.jpg']; // 手机验证码注册，默认用手机号充当用户名
                conn.query(addSql, addSqlParams, (error, results, fields) => {
                    results = JSON.parse(JSON.stringify(results));
                    if (!error) {
                        req.session.userId = results.insertId;
                        let sqlStr = "SELECT * FROM user_info WHERE id = '" + results.insertId + "' LIMIT 1";
                        conn.query(sqlStr, (error, results, fields) => {
                            if (error) {
                                res.json({
                                    err_code: 0,
                                    message: '注册失败'
                                });
                                console.log(error);
                            } else {
                                results = JSON.parse(JSON.stringify(results));

                                res.json({
                                    success_code: 200,
                                    message: {
                                        id: results[0].id,
                                        user_name: results[0].user_name,
                                        user_phone: results[0].user_phone,
                                        user_avatar: results[0].user_avatar
                                    }
                                });
                            }
                        });
                    }
                });
            }
        }
    });

});

/**
 * 用户名和密码登录
 */
router.post('/api/login_pwd', (req, res) => {
    // console.log(req.session.captcha);
    // console.log(tmp_captcha);
    // 获取数据
    const user_name = req.body.name;
    const user_pwd = md5(md5(req.body.pwd) + S_KEY);
    const captcha = req.body.captcha.toLowerCase();

    // 验证图形验证码是否正确
    if (captcha !== tmp_captcha) {
        res.json({
            err_code: 0,
            message: '图形验证码不正确!'
        });
        return;
    }

    tmp_captcha = '';

    // 查询数据
    let sqlStr = "SELECT * FROM user_info WHERE user_name = '" + user_name + "' LIMIT 1";
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            res.json({
                err_code: 0,
                message: '用户名不正确!'
            });
        } else {
            results = JSON.parse(JSON.stringify(results));
            if (results[0]) { // 用户已经存在
                if (results[0].user_status == 0) {
                    res.json({
                        err_code: 301,
                        message: '用户已冻结!'
                    });
                } else {
                    // 验证密码是否正确
                    if (results[0].user_pwd !== user_pwd) {
                        res.json({
                            err_code: 0,
                            message: '密码不正确!'
                        });
                    } else {
                        req.session.userId = results[0].id;
                        res.json({
                            success_code: 200,
                            message: {
                                id: results[0].id,
                                user_name: results[0].user_name || '',
                                user_nickname: results[0].user_nickname || '',
                                user_phone: results[0].user_phone || '',
                                user_sex: results[0].user_sex || '',
                                user_address: results[0].user_address || '',
                                user_sign: results[0].user_sign || '',
                                user_birthday: results[0].user_birthday || '',
                                user_avatar: results[0].user_avatar || ''
                            },
                            info: '登录成功!'
                        });
                    }
                }
            } else { // 新用户
                const addSql = "INSERT INTO user_info(user_name, user_pwd, user_avatar) VALUES (?, ?, ?)";
                const addSqlParams = [user_name, user_pwd, 'http://localhost:' + config.port + '/avatar_uploads/avatar_default.jpg'];
                conn.query(addSql, addSqlParams, (error, results, fields) => {
                    results = JSON.parse(JSON.stringify(results));
                    if (!error) {
                        req.session.userId = results.insertId;
                        let sqlStr = "SELECT * FROM user_info WHERE id = '" + results.insertId + "' LIMIT 1";
                        conn.query(sqlStr, (error, results, fields) => {
                            if (error) {
                                res.json({
                                    err_code: 0,
                                    message: '注册失败'
                                });
                            } else {
                                results = JSON.parse(JSON.stringify(results));

                                res.json({
                                    success_code: 200,
                                    message: {
                                        id: results[0].id,
                                        user_name: results[0].user_name || '',
                                        user_nickname: results[0].user_nickname || '',
                                        user_avatar: results[0].user_avatar || ''
                                    }
                                });
                            }
                        });
                    }
                });
            }
        }
    });
});

/**
 *  根据session中的用户id获取用户信息
 * */
router.get('/api/user_info', (req, res) => {
    // 获取参数
    let userId = req.query.user_id || req.session.userId;

    let sqlStr = "SELECT * FROM user_info WHERE id = " + userId + " LIMIT 1";
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            res.json({
                err_code: 0,
                message: '请求用户数据失败'
            });
        } else {
            results = JSON.parse(JSON.stringify(results));
            if (!results[0]) {
                delete req.session.userId;
                res.json({
                    error_code: 1,
                    message: '请先登录'
                });
            } else {
                res.json({
                    success_code: 200,
                    message: {
                        id: results[0].id,
                        user_name: results[0].user_name || '',
                        user_nickname: results[0].user_nickname || '',
                        user_phone: results[0].user_phone || '',
                        user_sex: results[0].user_sex || '',
                        user_address: results[0].user_address || '',
                        user_sign: results[0].user_sign || '',
                        user_birthday: results[0].user_birthday || '',
                        user_avatar: results[0].user_avatar || ''
                    },
                });
            }
        }
    });
});

/**
 * 退出登录
 */
router.get('/api/logout', (req, res) => {
    // 清除session中userId
    delete req.session.userId;

    res.json({
        success_code: 200,
        message: "退出登录成功"
    });
});

export default router;